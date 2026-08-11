import { ConflictException, NotFoundException } from '@nestjs/common';
import { LokerStatus } from '@prisma/client';
import { KioskRfidService } from './kiosk-rfid.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { MqttClientService } from '../gateway/mqtt-client.service';
import type { PaymentProvider } from '../payment/payment-provider.interface';
import type { KioskAmbilService } from './kiosk-ambil.service';

/**
 * Fitur member RFID (di luar cakupan PRD awal, lihat kiosk-rfid.service.ts).
 * Logika paling berisiko: (1) member eksklusif tap = TOGGLE simpan/ambil
 * berdasarkan status loker saat ini, (2) member umum tap PERTAMA vs KEDUA
 * dibedakan dari ada-tidaknya sesi aktif, (3) loker eksklusif yang bukan di
 * kiosk ini WAJIB ditolak (bukan diam-diam dibuka di kiosk yang salah).
 */
describe('KioskRfidService', () => {
  const unit = { id: 'unit-1', kodeUnit: 'UNIT-01', lokasiId: 'lokasi-1' } as never;

  function buildService(opts: {
    member?: unknown;
    loker?: unknown;
    sesiAktifMember?: { id: string; overdue: boolean; suspended: boolean } | null;
    sesiFindFirst?: unknown;
  } = {}) {
    const lokerUpdate = jest.fn().mockResolvedValue({});
    const sesiCreate = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'sesi-baru', ...data }));
    const txLokerUpdate = jest.fn().mockResolvedValue({});
    const tx = { loker: { update: txLokerUpdate }, sesiTransaksi: { create: sesiCreate } };

    const prisma = {
      db: {
        member: {
          findFirst: jest.fn().mockResolvedValue(
            opts.member !== undefined ? opts.member : { id: 'member-1', nama: 'Budi', lokerId: null, diskonPersen: 10, aktif: true },
          ),
        },
        loker: {
          findUnique: jest.fn().mockResolvedValue(
            opts.loker !== undefined
              ? opts.loker
              : { id: 'loker-1', unitId: 'unit-1', nomorLoker: '01', status: LokerStatus.TERSEDIA, lokerKategoriId: 'kategori-1', unit: { kodeUnit: 'UNIT-01' } },
          ),
          update: lokerUpdate,
        },
        unitDurasiHarga: {
          findFirst: jest.fn().mockResolvedValue({ id: 'durasi-1', harga: 15_000 }),
        },
        sesiTransaksi: {
          findFirst: jest.fn().mockResolvedValue(opts.sesiFindFirst !== undefined ? opts.sesiFindFirst : { id: 'sesi-lama' }),
        },
        $transaction: jest.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(tx)),
      },
    } as unknown as PrismaService;

    const mqttClient = { publishPerintahBukaPintu: jest.fn() } as unknown as MqttClientService;
    const paymentProvider = { name: 'xendit' } as unknown as PaymentProvider;
    const kioskAmbilService = {
      cariSesiAktifMember: jest.fn().mockResolvedValue(opts.sesiAktifMember !== undefined ? opts.sesiAktifMember : null),
    } as unknown as KioskAmbilService;

    return {
      service: new KioskRfidService(prisma, mqttClient, kioskAmbilService, paymentProvider),
      prisma,
      mqttClient,
      kioskAmbilService,
      lokerUpdate,
      sesiCreate,
      txLokerUpdate,
    };
  }

  it('lempar NotFoundException kalau kode RFID tidak terdaftar/tidak berlaku di kiosk ini', async () => {
    const { service } = buildService({ member: null });

    await expect(service.scan(unit, { kode: 'RFID-X' })).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('member eksklusif — tap = toggle simpan/ambil', () => {
    it('lempar ConflictException kalau loker eksklusif kartu ini bukan di kiosk ini', async () => {
      const { service } = buildService({
        member: { id: 'member-1', lokerId: 'loker-1', aktif: true },
        loker: { id: 'loker-1', unitId: 'unit-LAIN', nomorLoker: '01', status: LokerStatus.TERSEDIA, unit: { kodeUnit: 'LAIN' } },
      });

      await expect(service.scan(unit, { kode: 'RFID-1' })).rejects.toMatchObject({
        response: { error: { code: 'LOKER_BUKAN_DI_KIOSK_INI' } },
      });
    });

    it('loker TERSEDIA -> tap berarti SIMPAN: buka pintu, buat sesi gratis (nominal 0), loker jadi TERISI', async () => {
      const { service, mqttClient, sesiCreate, txLokerUpdate } = buildService({
        member: { id: 'member-1', lokerId: 'loker-1', aktif: true },
        loker: { id: 'loker-1', unitId: 'unit-1', nomorLoker: '01', status: LokerStatus.TERSEDIA, lokerKategoriId: 'kategori-1', unit: { kodeUnit: 'UNIT-01' } },
      });

      const result = await service.scan(unit, { kode: 'RFID-1' });

      expect(result).toEqual({ jenis: 'EKSKLUSIF', aksi: 'simpan', nomorLoker: '01' });
      expect(sesiCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ memberId: 'member-1', nominal: 0, metodeAkses: 'RFID' }) }),
      );
      expect(txLokerUpdate).toHaveBeenCalledWith({ where: { id: 'loker-1' }, data: { status: LokerStatus.TERISI } });
      expect(mqttClient.publishPerintahBukaPintu).toHaveBeenCalledWith('UNIT-01', '01', 'sesi-baru');
    });

    it('loker TERISI -> tap berarti AMBIL: buka pintu, loker kembali TERSEDIA', async () => {
      const { service, mqttClient, lokerUpdate, prisma } = buildService({
        member: { id: 'member-1', lokerId: 'loker-1', aktif: true },
        loker: { id: 'loker-1', unitId: 'unit-1', nomorLoker: '01', status: LokerStatus.TERISI, lokerKategoriId: 'kategori-1', unit: { kodeUnit: 'UNIT-01' } },
        sesiFindFirst: { id: 'sesi-lama' },
      });

      const result = await service.scan(unit, { kode: 'RFID-1' });

      expect(result).toEqual({ jenis: 'EKSKLUSIF', aksi: 'ambil', nomorLoker: '01' });
      expect(mqttClient.publishPerintahBukaPintu).toHaveBeenCalledWith('UNIT-01', '01', 'sesi-lama');
      expect(lokerUpdate).toHaveBeenCalledWith({ where: { id: 'loker-1' }, data: { status: LokerStatus.TERSEDIA } });
      expect(prisma.db.sesiTransaksi.findFirst).toHaveBeenCalled();
    });

    it('loker TERISI tapi tidak ada sesi milik member ini -> ConflictException (data tidak konsisten)', async () => {
      const { service } = buildService({
        member: { id: 'member-1', lokerId: 'loker-1', aktif: true },
        loker: { id: 'loker-1', unitId: 'unit-1', nomorLoker: '01', status: LokerStatus.TERISI, lokerKategoriId: 'kategori-1', unit: { kodeUnit: 'UNIT-01' } },
        sesiFindFirst: null,
      });

      await expect(service.scan(unit, { kode: 'RFID-1' })).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('member umum — tap pertama vs kedua', () => {
    it('belum ada sesi aktif -> UMUM_MEMBER_BARU (kiosk lanjut pilih kategori/durasi)', async () => {
      const { service } = buildService({
        member: { id: 'member-1', nama: 'Budi', lokerId: null, diskonPersen: 10, aktif: true },
        sesiAktifMember: null,
      });

      await expect(service.scan(unit, { kode: 'RFID-2' })).resolves.toEqual({
        jenis: 'UMUM_MEMBER_BARU',
        memberId: 'member-1',
        nama: 'Budi',
        diskonPersen: 10,
      });
    });

    it('sudah ada sesi aktif -> UMUM_SESI_AKTIF (kiosk ke alur ambil/denda, bukan sewa baru)', async () => {
      const { service } = buildService({
        member: { id: 'member-1', nama: 'Budi', lokerId: null, diskonPersen: 10, aktif: true },
        sesiAktifMember: { id: 'sesi-aktif', overdue: false, suspended: false },
      });

      await expect(service.scan(unit, { kode: 'RFID-2' })).resolves.toEqual({
        jenis: 'UMUM_SESI_AKTIF',
        id: 'sesi-aktif',
        overdue: false,
        suspended: false,
      });
    });
  });
});
