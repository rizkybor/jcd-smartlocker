import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LokerStatus } from '@prisma/client';
import { KioskAmbilService } from './kiosk-ambil.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { OtpService } from '../otp/otp.service';
import type { ConfigService } from '@nestjs/config';
import type { MqttClientService } from '../gateway/mqtt-client.service';
import type { EnvConfig } from '../config/env.validation';

/**
 * SMB-1101 — state machine OTP alur ambil barang (§5.2): pemilihan channel
 * tujuan, verifikasi kode, dan idempotensi bukaPintu. Prisma/OtpService
 * di-mock; catatan penting yang ikut diverifikasi di sini: verifikasiOtp()
 * TIDAK punya pengecekan expiry timestamp sendiri di kode — hanya hash
 * compare — jadi test "OTP salah" & "OTP belum dikirim" mewakili batas
 * perilaku yang benar-benar ada, bukan asumsi expiry yang belum diimplementasikan.
 */
describe('KioskAmbilService', () => {
  const unit = { id: 'unit-1' } as never;

  function buildService(opts: {
    channelAktif?: 'email' | 'whatsapp';
    sesiAktif?: Record<string, unknown> | null;
  } = {}) {
    const sesiAktif =
      opts.sesiAktif !== undefined
        ? opts.sesiAktif
        : { id: 'sesi-1', nomorHp: '081234567890', email: 'a@b.com', kodeOtpAmbilHash: null };

    const updateSesi = jest.fn().mockResolvedValue({});
    const updateLoker = jest.fn().mockResolvedValue({});
    const prisma = {
      db: {
        sesiTransaksi: {
          findFirst: jest.fn().mockResolvedValue(sesiAktif),
          findUnique: jest.fn(),
          update: updateSesi,
        },
        loker: { update: updateLoker },
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

    return {
      service: new KioskAmbilService(prisma, otpService, config, mqttClient),
      prisma,
      otpService,
      mqttClient,
      updateSesi,
      updateLoker,
    };
  }

  describe('mulaiAmbil', () => {
    it('lempar NotFoundException kalau tidak ada sesi aktif untuk nomorHp di unit ini', async () => {
      const { service, prisma } = buildService();
      (prisma.db.sesiTransaksi.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.mulaiAmbil(unit, { nomorHp: '081234567890' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('mengembalikan id sesi kalau ditemukan', async () => {
      const { service, prisma } = buildService();
      (prisma.db.sesiTransaksi.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'sesi-1' });

      await expect(service.mulaiAmbil(unit, { nomorHp: '081234567890' })).resolves.toEqual({ id: 'sesi-1' });
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
        sesiAktif: { id: 'sesi-1', nomorHp: null, email: 'a@b.com', kodeOtpAmbilHash: null },
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
  });

  describe('verifikasiOtp', () => {
    it('lempar ConflictException OTP_BELUM_DIKIRIM kalau belum ada hash tersimpan', async () => {
      const { service } = buildService({ sesiAktif: { id: 'sesi-1', kodeOtpAmbilHash: null } });

      await expect(service.verifikasiOtp({ sesiId: 'sesi-1', kode: '123456' })).rejects.toMatchObject({
        response: { error: { code: 'OTP_BELUM_DIKIRIM' } },
      });
    });

    it('lempar UnauthorizedException KODE_OTP_SALAH kalau hash tidak cocok', async () => {
      const { service, otpService } = buildService({ sesiAktif: { id: 'sesi-1', kodeOtpAmbilHash: 'hashed' } });
      (otpService.verifyCode as jest.Mock).mockReturnValue(false);

      await expect(service.verifikasiOtp({ sesiId: 'sesi-1', kode: '000000' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('tandai otpVerifiedAt kalau kode cocok', async () => {
      const { service, otpService, updateSesi } = buildService({
        sesiAktif: { id: 'sesi-1', kodeOtpAmbilHash: 'hashed' },
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

  describe('bukaPintu — idempotensi', () => {
    it('idempotent — kalau loker sudah TERSEDIA, tidak publish MQTT/update DB lagi', async () => {
      const sesi = { id: 'sesi-1', otpVerifiedAt: new Date(), loker: { status: LokerStatus.TERSEDIA, nomorLoker: '01', unit: { kodeUnit: 'UNIT-01' } } };
      const { service, prisma, mqttClient, updateLoker } = buildService();
      (prisma.db.sesiTransaksi.findUnique as jest.Mock).mockResolvedValue(sesi);

      const result = await service.bukaPintu('sesi-1');

      expect(result).toBe(sesi);
      expect(mqttClient.publishPerintahBukaPintu).not.toHaveBeenCalled();
      expect(updateLoker).not.toHaveBeenCalled();
    });

    it('lempar ConflictException OTP_BELUM_TERVERIFIKASI kalau otpVerifiedAt belum diset', async () => {
      const sesi = { id: 'sesi-1', otpVerifiedAt: null, loker: { status: LokerStatus.TERISI } };
      const { service, prisma } = buildService();
      (prisma.db.sesiTransaksi.findUnique as jest.Mock).mockResolvedValue(sesi);

      await expect(service.bukaPintu('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'OTP_BELUM_TERVERIFIKASI' } },
      });
    });

    it('publish MQTT & set loker TERSEDIA saat pertama kali dibuka', async () => {
      const sesi = {
        id: 'sesi-1',
        lokerId: 'loker-1',
        otpVerifiedAt: new Date(),
        loker: { status: LokerStatus.TERISI, nomorLoker: '01', unit: { kodeUnit: 'UNIT-01' } },
      };
      const { service, prisma, mqttClient, updateLoker } = buildService();
      (prisma.db.sesiTransaksi.findUnique as jest.Mock).mockResolvedValue(sesi);

      await service.bukaPintu('sesi-1');

      expect(mqttClient.publishPerintahBukaPintu).toHaveBeenCalledWith('UNIT-01', '01', 'sesi-1');
      expect(updateLoker).toHaveBeenCalledWith({ where: { id: 'loker-1' }, data: { status: LokerStatus.TERSEDIA } });
    });

    it('lempar NotFoundException kalau sesi tidak ditemukan', async () => {
      const { service, prisma } = buildService();
      (prisma.db.sesiTransaksi.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.bukaPintu('sesi-x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
