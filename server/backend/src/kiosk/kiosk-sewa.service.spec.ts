import { ConflictException, NotFoundException } from '@nestjs/common';
import { StatusBayar } from '@prisma/client';
import { KioskSewaService } from './kiosk-sewa.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { PaymentProvider } from '../payment/payment-provider.interface';
import type { MqttClientService } from '../gateway/mqtt-client.service';

/**
 * SMB-1101 — logika paling berisiko di kiosk-sewa.service.ts:
 * (1) assign loker atomik lewat `FOR UPDATE SKIP LOCKED` (mulaiSewa), dan
 * (2) idempotensi bukaPintu + perhitungan waktuSelesai dari durasiJam.
 * Prisma di-mock penuh — race condition Postgres sungguhan sudah ditutupi
 * SMB-1102/integration test terpisah; di sini cuma memverifikasi bentuk
 * kode: transaksi dipakai, error code yang benar dilempar saat kandidat
 * kosong, dan efek samping (mqtt publish, update DB) tidak dobel saat idempotent.
 */
describe('KioskSewaService', () => {
  const unit = { id: 'unit-1', kodeUnit: 'UNIT-01' } as never;

  function buildService(overrides: {
    queryRawResult?: { id: string }[];
    durasiHarga?: unknown;
    member?: unknown;
  } = {}) {
    const txQueryRaw = jest.fn().mockResolvedValue(overrides.queryRawResult ?? [{ id: 'loker-1' }]);
    const txLokerUpdate = jest.fn().mockResolvedValue({});
    const txSesiCreate = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'sesi-1', ...data }));

    const tx = {
      $queryRaw: txQueryRaw,
      loker: { update: txLokerUpdate },
      sesiTransaksi: { create: txSesiCreate },
    };

    const prisma = {
      db: {
        unitDurasiHarga: {
          findFirst: jest.fn().mockResolvedValue(
            overrides.durasiHarga !== undefined
              ? overrides.durasiHarga
              : { id: 'durasi-1', durasiJam: 3, harga: 15_000, lokerKategoriId: 'kategori-1' },
          ),
        },
        member: {
          findFirst: jest.fn().mockResolvedValue(
            overrides.member !== undefined ? overrides.member : { id: 'member-1', diskonPersen: 20, lokerId: null, aktif: true },
          ),
        },
        $transaction: jest.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(tx)),
        sesiTransaksi: {},
      },
    } as unknown as PrismaService;

    const paymentProvider = { name: 'xendit' } as unknown as PaymentProvider;
    const mqttClient = { publishPerintahBukaPintu: jest.fn() } as unknown as MqttClientService;

    return { service: new KioskSewaService(prisma, paymentProvider, mqttClient), prisma, mqttClient, tx };
  }

  describe('statusUnit — kategori ukuran dengan harga & ketersediaan sendiri', () => {
    it('mengelompokkan durasiHarga per kategori, masing-masing dengan jumlahTersedia sendiri', async () => {
      const lokerKategoriFindMany = jest.fn().mockResolvedValue([
        {
          id: 'kategori-kecil',
          nama: 'Kecil',
          ukuranWMm: 300,
          ukuranHMm: 300,
          durasiHarga: [{ id: 'dh-1', durasiJam: 1, harga: 5_000 }],
          lokers: [
            { id: 'loker-1', nomorLoker: '001', status: 'TERSEDIA' },
            { id: 'loker-2', nomorLoker: '002', status: 'TERISI' },
          ],
          _count: { lokers: 2 },
        },
        {
          id: 'kategori-besar',
          nama: 'Besar',
          ukuranWMm: 400,
          ukuranHMm: 860,
          durasiHarga: [{ id: 'dh-2', durasiJam: 1, harga: 12_000 }],
          lokers: [],
          _count: { lokers: 0 },
        },
      ]);
      const prisma = {
        db: {
          lokerKategori: { findMany: lokerKategoriFindMany },
          loker: {
            count: jest
              .fn()
              .mockResolvedValueOnce(2) // jumlahTersedia keseluruhan unit
              .mockResolvedValueOnce(6), // jumlahTotal keseluruhan unit
          },
          mitra: { findUnique: jest.fn().mockResolvedValue({ nama: 'Mitra Test' }) },
        },
      } as unknown as PrismaService;
      const service = new KioskSewaService(prisma, { name: 'xendit' } as unknown as PaymentProvider, {} as MqttClientService);

      const result = await service.statusUnit(unit);

      expect(result.kategori).toEqual([
        {
          id: 'kategori-kecil',
          nama: 'Kecil',
          ukuranWMm: 300,
          ukuranHMm: 300,
          jumlahTersedia: 2,
          durasiHarga: [{ id: 'dh-1', durasiJam: 1, harga: 5_000 }],
          lokers: [
            { id: 'loker-1', nomorLoker: '001', status: 'TERSEDIA' },
            { id: 'loker-2', nomorLoker: '002', status: 'TERISI' },
          ],
        },
        {
          id: 'kategori-besar',
          nama: 'Besar',
          ukuranWMm: 400,
          ukuranHMm: 860,
          jumlahTersedia: 0,
          durasiHarga: [{ id: 'dh-2', durasiJam: 1, harga: 12_000 }],
          lokers: [],
        },
      ]);
      expect(result.unitPenuh).toBe(false);
      expect(result.mitraNama).toBe('Mitra Test');
    });
  });

  describe('mulaiSewa — assign loker atomik', () => {
    it('lempar NotFoundException DURASI_TIDAK_DITEMUKAN kalau durasiHarga tidak ada/tidak aktif', async () => {
      const { service } = buildService({ durasiHarga: null });

      await expect(
        service.mulaiSewa(unit, { nomorHp: '081234567890', email: 'a@b.com', unitDurasiHargaId: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lempar ConflictException LOKER_TIDAK_TERSEDIA kalau tidak ada kandidat loker (kalah race atau memang penuh)', async () => {
      const { service } = buildService({ queryRawResult: [] });

      await expect(
        service.mulaiSewa(unit, { nomorHp: '081234567890', email: 'a@b.com', unitDurasiHargaId: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('meng-update status loker jadi TERISI dan membuat sesi transaksi dalam satu $transaction', async () => {
      const { service, prisma, tx } = buildService();

      const result = await service.mulaiSewa(unit, {
        nomorHp: '081234567890',
        email: 'a@b.com',
        unitDurasiHargaId: 'durasi-1',
      });

      expect(prisma.db.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.loker.update).toHaveBeenCalledWith({ where: { id: 'loker-1' }, data: { status: 'TERISI' } });
      expect(tx.sesiTransaksi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lokerId: 'loker-1',
            unitDurasiHargaId: 'durasi-1',
            nomorHp: '081234567890',
            email: 'a@b.com',
            nominal: 15_000,
            paymentProvider: 'xendit',
          }),
        }),
      );
      expect((result as { idTransaksi: string }).idTransaksi).toMatch(/^SB-[0-9A-Z]+-[0-9A-F]{6}$/);
    });

    it('kandidat loker WAJIB difilter ke kategori durasiHarga yang dipilih — tidak boleh assign lintas kategori ukuran', async () => {
      const { service, tx } = buildService({
        durasiHarga: { id: 'durasi-1', durasiJam: 3, harga: 15_000, lokerKategoriId: 'kategori-besar' },
      });

      await service.mulaiSewa(unit, { nomorHp: '081234567890', email: 'a@b.com', unitDurasiHargaId: 'durasi-1' });

      const sqlFragment = (tx.$queryRaw as jest.Mock).mock.calls[0][0] as { values: unknown[] };
      expect(sqlFragment.values).toContain('kategori-besar');
    });

    it('query kandidat loker WAJIB mengecualikan loker yang diikat eksklusif ke member (NOT EXISTS member)', async () => {
      const { service, tx } = buildService();

      await service.mulaiSewa(unit, { nomorHp: '081234567890', email: 'a@b.com', unitDurasiHargaId: 'durasi-1' });

      const sqlFragment = (tx.$queryRaw as jest.Mock).mock.calls[0][0] as { strings: string[] };
      const sql = sqlFragment.strings.join(' ');
      expect(sql).toContain('NOT EXISTS');
      expect(sql).toContain('member');
    });

    it('fitur pilih loker spesifik: lokerId dari pelanggan disisipkan sebagai filter tambahan di query kandidat', async () => {
      const { service, tx } = buildService();

      await service.mulaiSewa(unit, { nomorHp: '081234567890', email: 'a@b.com', unitDurasiHargaId: 'durasi-1', lokerId: 'loker-pilihan' });

      const sqlFragment = (tx.$queryRaw as jest.Mock).mock.calls[0][0] as { strings: string[]; values: unknown[] };
      expect(sqlFragment.values).toContain('loker-pilihan');
      expect(sqlFragment.strings.join(' ')).toContain('AND id =');
    });

    it('tanpa lokerId (jalur lama/RFID) — query TIDAK menambahkan filter id spesifik', async () => {
      const { service, tx } = buildService();

      await service.mulaiSewa(unit, { nomorHp: '081234567890', email: 'a@b.com', unitDurasiHargaId: 'durasi-1' });

      const sqlFragment = (tx.$queryRaw as jest.Mock).mock.calls[0][0] as { strings: string[] };
      expect(sqlFragment.strings.join(' ')).not.toContain('AND id =');
    });

    describe('fitur member RFID — sewa via memberId (diskon, bukan nomorHp/email)', () => {
      it('lempar NotFoundException MEMBER_TIDAK_DITEMUKAN kalau member tidak ada/tidak berlaku di unit ini', async () => {
        const { service } = buildService({ member: null });

        await expect(
          service.mulaiSewa(unit, { memberId: 'member-x', unitDurasiHargaId: 'durasi-1' }),
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      it('hitung nominal terdiskon & simpan memberId + metodeAkses RFID, TANPA nomorHp/email', async () => {
        const { service, tx } = buildService({ member: { id: 'member-1', diskonPersen: 20, lokerId: null, aktif: true } });

        await service.mulaiSewa(unit, { memberId: 'member-1', unitDurasiHargaId: 'durasi-1' });

        expect(tx.sesiTransaksi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              memberId: 'member-1',
              metodeAkses: 'RFID',
              nominal: 12_000, // 15.000 - 20% = 12.000
              nomorHp: null,
              email: null,
            }),
          }),
        );
      });
    });
  });

  describe('bukaPintu — idempotensi & perhitungan waktuSelesai', () => {
    function buildBukaPintuService(sesi: Record<string, unknown>) {
      const update = jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...sesi, ...data }));
      const mqttClient = { publishPerintahBukaPintu: jest.fn() } as unknown as MqttClientService;
      const prisma = {
        db: { sesiTransaksi: { findUnique: jest.fn().mockResolvedValue(sesi), update } },
      } as unknown as PrismaService;
      const service = new KioskSewaService(prisma, { name: 'xendit' } as unknown as PaymentProvider, mqttClient);
      return { service, update, mqttClient };
    }

    it('lempar ConflictException SESI_BELUM_DIBAYAR kalau statusBayar bukan PAID', async () => {
      const { service } = buildBukaPintuService({ statusBayar: StatusBayar.PENDING });

      await expect(service.bukaPintu('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'SESI_BELUM_DIBAYAR' } },
      });
    });

    it('idempotent — kalau waktuMulai sudah pernah diset, tidak publish MQTT/update DB lagi', async () => {
      const sesi = {
        id: 'sesi-1',
        statusBayar: StatusBayar.PAID,
        waktuMulai: new Date('2026-01-01T00:00:00Z'),
        waktuSelesai: new Date('2026-01-01T03:00:00Z'),
        loker: { nomorLoker: '01', unit: { kodeUnit: 'UNIT-01' } },
        unitDurasiHarga: { durasiJam: 3 },
      };
      const { service, update, mqttClient } = buildBukaPintuService(sesi);

      const result = await service.bukaPintu('sesi-1');

      expect(result).toBe(sesi);
      expect(mqttClient.publishPerintahBukaPintu).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });

    it('menghitung waktuSelesai = waktuMulai + durasiJam jam saat pertama kali dibuka', async () => {
      const sesi = {
        id: 'sesi-1',
        statusBayar: StatusBayar.PAID,
        waktuMulai: null,
        loker: { nomorLoker: '01', unit: { kodeUnit: 'UNIT-01' } },
        unitDurasiHarga: { durasiJam: 3 },
      };
      const { service, update, mqttClient } = buildBukaPintuService(sesi);

      const before = Date.now();
      await service.bukaPintu('sesi-1');
      const after = Date.now();

      expect(mqttClient.publishPerintahBukaPintu).toHaveBeenCalledWith('UNIT-01', '01', 'sesi-1');
      const call = update.mock.calls[0][0];
      const { waktuMulai, waktuSelesai } = call.data as { waktuMulai: Date; waktuSelesai: Date };
      expect(waktuMulai.getTime()).toBeGreaterThanOrEqual(before);
      expect(waktuMulai.getTime()).toBeLessThanOrEqual(after);
      expect(waktuSelesai.getTime() - waktuMulai.getTime()).toBe(3 * 60 * 60 * 1000);
    });
  });

  describe('buatPembayaran', () => {
    it('lempar ConflictException SESI_SUDAH_DIPROSES kalau statusBayar bukan PENDING', async () => {
      const prisma = {
        db: { sesiTransaksi: { findUnique: jest.fn().mockResolvedValue({ statusBayar: StatusBayar.PAID }) } },
      } as unknown as PrismaService;
      const service = new KioskSewaService(
        prisma,
        { name: 'xendit', createQrisCharge: jest.fn() } as unknown as PaymentProvider,
        {} as MqttClientService,
      );

      await expect(service.buatPembayaran('sesi-1')).rejects.toMatchObject({
        response: { error: { code: 'SESI_SUDAH_DIPROSES' } },
      });
    });
  });
});
