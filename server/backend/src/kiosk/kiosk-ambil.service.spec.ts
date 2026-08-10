import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LokerStatus, StatusBayar } from '@prisma/client';
import { KioskAmbilService } from './kiosk-ambil.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { OtpService } from '../otp/otp.service';
import type { ConfigService } from '@nestjs/config';
import type { MqttClientService } from '../gateway/mqtt-client.service';
import type { PaymentProvider } from '../payment/payment-provider.interface';
import type { EnvConfig } from '../config/env.validation';

/**
 * SMB-1101 — state machine OTP alur ambil barang (§5.2): pemilihan channel
 * tujuan, verifikasi kode, idempotensi bukaPintu, DAN alur denda/overdue/
 * suspend keterlambatan ambil barang (permintaan bisnis tambahan — lihat
 * overdue.util.ts). Prisma/OtpService/PaymentProvider di-mock; catatan
 * penting yang ikut diverifikasi: verifikasiOtp() TIDAK punya pengecekan
 * expiry timestamp sendiri di kode — hanya hash compare.
 */
describe('KioskAmbilService', () => {
  const unit = { id: 'unit-1' } as never;

  /** durasiHarga unit ini: 1 jam = Rp5.000 (rate 5.000/jam) -> tarifPerJamTermurah = 5.000. */
  const durasiHargaUnit = [{ harga: 5_000, durasiJam: 1, aktif: true }];

  function sesiDefault(overrides: Record<string, unknown> = {}) {
    return {
      id: 'sesi-1',
      nomorHp: '081234567890',
      email: 'a@b.com',
      kodeOtpAmbilHash: null,
      otpVerifiedAt: null,
      waktuSelesai: null, // default: belum overdue
      lokerId: 'loker-1',
      unitDurasiHarga: { unit: { durasiHarga: durasiHargaUnit } },
      loker: { status: LokerStatus.TERISI, nomorLoker: '01', unit: { kodeUnit: 'UNIT-01' } },
      ...overrides,
    };
  }

  function buildService(opts: {
    channelAktif?: 'email' | 'whatsapp';
    sesiAktif?: Record<string, unknown> | null;
    sesiDendaPaid?: boolean;
  } = {}) {
    const sesiAktif = opts.sesiAktif !== undefined ? opts.sesiAktif : sesiDefault();

    const updateSesi = jest.fn().mockResolvedValue({});
    const updateLoker = jest.fn().mockResolvedValue({});
    const createDenda = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'denda-1', ...data }));
    const sesiDendaFindFirst = jest.fn().mockResolvedValue(opts.sesiDendaPaid ? { id: 'denda-1' } : null);

    const prisma = {
      db: {
        sesiTransaksi: {
          findFirst: jest.fn().mockResolvedValue(sesiAktif),
          findUnique: jest.fn().mockResolvedValue(sesiAktif),
          findUniqueOrThrow: jest.fn().mockResolvedValue(sesiAktif),
          update: updateSesi,
        },
        loker: { update: updateLoker },
        sesiDenda: { create: createDenda, findFirst: sesiDendaFindFirst },
      },
    } as unknown as PrismaService;

    const otpService = {
      generateCode: jest.fn().mockReturnValue('123456'),
      hashCode: jest.fn().mockReturnValue('hashed-123456'),
      verifyCode: jest.fn(),
      sendCode: jest.fn().mockResolvedValue(undefined),
    } as unknown as OtpService;

    const config = {
      get: jest.fn().mockReturnValue(opts.channelAktif ?? 'email'),
    } as unknown as ConfigService<EnvConfig, true>;
    const mqttClient = { publishPerintahBukaPintu: jest.fn() } as unknown as MqttClientService;
    const paymentProvider = {
      name: 'xendit',
      createQrisCharge: jest.fn().mockResolvedValue({ providerRefId: 'ref-1', qrString: 'qr-data', expiredAt: new Date() }),
    } as unknown as PaymentProvider;

    return {
      service: new KioskAmbilService(prisma, otpService, config, mqttClient, paymentProvider),
      prisma,
      otpService,
      mqttClient,
      paymentProvider,
      updateSesi,
      updateLoker,
      createDenda,
      sesiDendaFindFirst,
    };
  }

  describe('mulaiAmbil', () => {
    it('lempar NotFoundException kalau tidak ada sesi aktif untuk nomorHp di unit ini', async () => {
      const { service, prisma } = buildService();
      (prisma.db.sesiTransaksi.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.mulaiAmbil(unit, { nomorHp: '081234567890' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('mengembalikan id sesi + status belum overdue kalau waktuSelesai belum lewat', async () => {
      const { service } = buildService({ sesiAktif: sesiDefault({ waktuSelesai: null }) });

      await expect(service.mulaiAmbil(unit, { nomorHp: '081234567890' })).resolves.toEqual({
        id: 'sesi-1',
        overdue: false,
        suspended: false,
        jamTerlambat: 0,
        dendaNominal: 0,
      });
    });

    it('mengembalikan overdue=true + dendaNominal saat terlambat 3 jam (studi kasus dari permintaan)', async () => {
      const waktuSelesai = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const { service } = buildService({ sesiAktif: sesiDefault({ waktuSelesai }) });

      const result = await service.mulaiAmbil(unit, { nomorHp: '081234567890' });

      expect(result).toMatchObject({ overdue: true, suspended: false, jamTerlambat: 3, dendaNominal: 15_000 });
    });

    it('mengembalikan suspended=true saat terlambat >= 24 jam', async () => {
      const waktuSelesai = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const { service } = buildService({ sesiAktif: sesiDefault({ waktuSelesai }) });

      const result = await service.mulaiAmbil(unit, { nomorHp: '081234567890' });

      expect(result).toMatchObject({ overdue: true, suspended: true, dendaNominal: 0 });
    });
  });

  describe('bayarDenda', () => {
    it('lempar ConflictException BELUM_OVERDUE kalau sesi belum lewat waktuSelesai', async () => {
      const { service } = buildService({ sesiAktif: sesiDefault({ waktuSelesai: null }) });

      await expect(service.bayarDenda('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'BELUM_OVERDUE' } },
      });
    });

    it('lempar ConflictException LOKER_DISUSPEND kalau sudah >= 24 jam (tidak bisa bayar sendiri lagi)', async () => {
      const waktuSelesai = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const { service } = buildService({ sesiAktif: sesiDefault({ waktuSelesai }) });

      await expect(service.bayarDenda('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'LOKER_DISUSPEND' } },
      });
    });

    it('lempar ConflictException DENDA_SUDAH_LUNAS kalau sudah ada SesiDenda PAID', async () => {
      const waktuSelesai = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const { service } = buildService({ sesiAktif: sesiDefault({ waktuSelesai }), sesiDendaPaid: true });

      await expect(service.bayarDenda('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'DENDA_SUDAH_LUNAS' } },
      });
    });

    it('buat charge QRIS & simpan SesiDenda baru kalau overdue & belum lunas', async () => {
      const waktuSelesai = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const { service, paymentProvider, createDenda } = buildService({ sesiAktif: sesiDefault({ waktuSelesai }) });

      const result = await service.bayarDenda('sesi-1');

      expect(paymentProvider.createQrisCharge).toHaveBeenCalledWith(
        expect.objectContaining({ nominal: 15_000 }),
      );
      expect(createDenda).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sesiTransaksiId: 'sesi-1', jamTerlambat: 3, nominal: 15_000, paymentProviderRefId: 'ref-1' }),
        }),
      );
      expect(result).toMatchObject({ nominal: 15_000, jamTerlambat: 3, qrString: 'qr-data' });
    });
  });

  describe('kirimOtp — pemilihan destinasi channel', () => {
    it('pakai email kalau OTP_CHANNEL_ACTIVE = email', async () => {
      const { service, otpService } = buildService({ channelAktif: 'email' });

      await service.kirimOtp('sesi-1');

      expect(otpService.sendCode).toHaveBeenCalledWith('a@b.com', '123456', 5);
    });

    it('pakai nomorHp kalau OTP_CHANNEL_ACTIVE = whatsapp', async () => {
      const { service, otpService } = buildService({ channelAktif: 'whatsapp' });

      await service.kirimOtp('sesi-1');

      expect(otpService.sendCode).toHaveBeenCalledWith('081234567890', '123456', 5);
    });

    it('lempar ConflictException TUJUAN_OTP_TIDAK_ADA kalau field tujuan channel aktif kosong', async () => {
      const { service } = buildService({
        channelAktif: 'whatsapp',
        sesiAktif: sesiDefault({ nomorHp: null }),
      });

      await expect(service.kirimOtp('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'TUJUAN_OTP_TIDAK_ADA' } },
      });
    });

    it('bungkus kegagalan provider OTP jadi ConflictException OTP_GAGAL_KIRIM', async () => {
      const { service, otpService } = buildService();
      (otpService.sendCode as jest.Mock).mockRejectedValueOnce(new Error('Brevo 401'));

      await expect(service.kirimOtp('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'OTP_GAGAL_KIRIM' } },
      });
    });

    it('lempar ConflictException DENDA_BELUM_DIBAYAR kalau overdue & denda belum lunas', async () => {
      const waktuSelesai = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const { service } = buildService({ sesiAktif: sesiDefault({ waktuSelesai }), sesiDendaPaid: false });

      await expect(service.kirimOtp('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'DENDA_BELUM_DIBAYAR' } },
      });
    });

    it('boleh lanjut kirim OTP kalau overdue TAPI denda sudah lunas', async () => {
      const waktuSelesai = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const { service, otpService } = buildService({ sesiAktif: sesiDefault({ waktuSelesai }), sesiDendaPaid: true });

      await expect(service.kirimOtp('sesi-1')).resolves.toEqual({ terkirim: true });
      expect(otpService.sendCode).toHaveBeenCalled();
    });

    it('lempar ConflictException LOKER_DISUSPEND kalau >= 24 jam, walau ada percobaan bayar denda', async () => {
      const waktuSelesai = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const { service } = buildService({ sesiAktif: sesiDefault({ waktuSelesai }) });

      await expect(service.kirimOtp('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'LOKER_DISUSPEND' } },
      });
    });
  });

  describe('verifikasiOtp', () => {
    it('lempar ConflictException OTP_BELUM_DIKIRIM kalau belum ada hash tersimpan', async () => {
      const { service } = buildService({ sesiAktif: sesiDefault({ kodeOtpAmbilHash: null }) });

      await expect(service.verifikasiOtp({ sesiId: 'sesi-1', kode: '123456' })).rejects.toMatchObject({
        response: { error: { code: 'OTP_BELUM_DIKIRIM' } },
      });
    });

    it('lempar UnauthorizedException KODE_OTP_SALAH kalau hash tidak cocok', async () => {
      const { service, otpService } = buildService({ sesiAktif: sesiDefault({ kodeOtpAmbilHash: 'hashed' }) });
      (otpService.verifyCode as jest.Mock).mockReturnValue(false);

      await expect(service.verifikasiOtp({ sesiId: 'sesi-1', kode: '000000' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('tandai otpVerifiedAt kalau kode cocok', async () => {
      const { service, otpService, updateSesi } = buildService({
        sesiAktif: sesiDefault({ kodeOtpAmbilHash: 'hashed' }),
      });
      (otpService.verifyCode as jest.Mock).mockReturnValue(true);

      const result = await service.verifikasiOtp({ sesiId: 'sesi-1', kode: '123456' });

      expect(result).toEqual({ valid: true });
      expect(updateSesi).toHaveBeenCalledWith({
        where: { id: 'sesi-1' },
        data: { otpVerifiedAt: expect.any(Date) },
      });
    });
  });

  describe('bukaPintu — idempotensi & gerbang overdue', () => {
    it('idempotent — kalau loker sudah TERSEDIA, tidak publish MQTT/update DB lagi', async () => {
      const sesi = sesiDefault({
        otpVerifiedAt: new Date(),
        loker: { status: LokerStatus.TERSEDIA, nomorLoker: '01', unit: { kodeUnit: 'UNIT-01' } },
      });
      const { service, mqttClient, updateLoker } = buildService({ sesiAktif: sesi });

      const result = await service.bukaPintu('sesi-1');

      expect(result).toBe(sesi);
      expect(mqttClient.publishPerintahBukaPintu).not.toHaveBeenCalled();
      expect(updateLoker).not.toHaveBeenCalled();
    });

    it('lempar ConflictException OTP_BELUM_TERVERIFIKASI kalau otpVerifiedAt belum diset', async () => {
      const { service } = buildService({ sesiAktif: sesiDefault({ otpVerifiedAt: null }) });

      await expect(service.bukaPintu('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'OTP_BELUM_TERVERIFIKASI' } },
      });
    });

    it('publish MQTT & set loker TERSEDIA saat pertama kali dibuka', async () => {
      const sesi = sesiDefault({ otpVerifiedAt: new Date() });
      const { service, mqttClient, updateLoker } = buildService({ sesiAktif: sesi });

      await service.bukaPintu('sesi-1');

      expect(mqttClient.publishPerintahBukaPintu).toHaveBeenCalledWith('UNIT-01', '01', 'sesi-1');
      expect(updateLoker).toHaveBeenCalledWith({ where: { id: 'loker-1' }, data: { status: LokerStatus.TERSEDIA } });
    });

    it('lempar NotFoundException kalau sesi tidak ditemukan', async () => {
      const { service, prisma } = buildService();
      (prisma.db.sesiTransaksi.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.bukaPintu('sesi-x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('tetap menolak buka pintu kalau overdue & denda belum lunas, walau OTP sudah terverifikasi', async () => {
      const waktuSelesai = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const { service } = buildService({
        sesiAktif: sesiDefault({ waktuSelesai, otpVerifiedAt: new Date() }),
        sesiDendaPaid: false,
      });

      await expect(service.bukaPintu('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'DENDA_BELUM_DIBAYAR' } },
      });
    });

    it('boleh buka pintu kalau overdue TAPI denda sudah lunas & OTP terverifikasi', async () => {
      const waktuSelesai = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const { service, mqttClient } = buildService({
        sesiAktif: sesiDefault({ waktuSelesai, otpVerifiedAt: new Date() }),
        sesiDendaPaid: true,
      });

      await service.bukaPintu('sesi-1');

      expect(mqttClient.publishPerintahBukaPintu).toHaveBeenCalled();
    });

    it('tetap menolak buka pintu kalau sudah >= 24 jam (suspend), walau OTP sudah terverifikasi & ada percobaan bayar', async () => {
      const waktuSelesai = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const { service } = buildService({
        sesiAktif: sesiDefault({ waktuSelesai, otpVerifiedAt: new Date() }),
        sesiDendaPaid: true, // walau seandainya ada baris denda lunas, tetap harus ditolak begitu masuk zona suspend
      });

      await expect(service.bukaPintu('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'LOKER_DISUSPEND' } },
      });
    });
  });

  describe('statusDenda', () => {
    it('lempar NotFoundException DENDA_BELUM_DIBUAT kalau belum pernah ada tagihan denda', async () => {
      const { service, prisma } = buildService();
      (prisma.db.sesiDenda.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.statusDenda('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'DENDA_BELUM_DIBUAT' } },
      });
    });

    it('mengembalikan statusBayar tagihan denda TERBARU', async () => {
      const { service, prisma } = buildService();
      (prisma.db.sesiDenda.findFirst as jest.Mock).mockResolvedValue({ statusBayar: StatusBayar.PENDING });

      await expect(service.statusDenda('sesi-1')).resolves.toEqual({ statusBayar: StatusBayar.PENDING });
    });
  });
});
