import { LokerStatus } from '@prisma/client';
import { OverviewService } from './overview.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { GatewayService } from '../gateway/gateway.service';

/**
 * Fitur monitoring lanjutan Overview Super Admin (di luar cakupan PRD awal
 * — permintaan bisnis langsung): tren transaksi, rollup per mitra, daftar
 * loker. Logika paling berisiko: (1) `mitraRingkasan()` HARUS batched jadi
 * 1 query sesiTransaksi (bukan N+1 per mitra, sama kelas bug seperti
 * `LaporanService.bagiHasil()`), (2) `tren()` mengisi hari tanpa transaksi
 * dengan 0 (bukan bolong), (3) `lokerList()` mengembalikan overdueStatus
 * cuma untuk loker TERISI yang punya sesi aktif.
 */
describe('OverviewService', () => {
  function buildService(overrides: {
    mitraList?: unknown[];
    sesiTransaksiFindMany?: unknown[];
    lokerFindMany?: unknown[];
    lokerCount?: number;
  } = {}) {
    const sesiTransaksiFindMany = jest.fn().mockResolvedValue(overrides.sesiTransaksiFindMany ?? []);
    const mitraFindMany = jest.fn().mockResolvedValue(overrides.mitraList ?? []);
    const lokerFindMany = jest.fn().mockResolvedValue(overrides.lokerFindMany ?? []);
    const lokerCount = jest.fn().mockResolvedValue(overrides.lokerCount ?? 0);

    const prisma = {
      db: {
        mitra: { findMany: mitraFindMany },
        sesiTransaksi: { findMany: sesiTransaksiFindMany },
        loker: { findMany: lokerFindMany, count: lokerCount, groupBy: jest.fn() },
        lokasi: { count: jest.fn() },
        unit: { findMany: jest.fn() },
      },
    } as unknown as PrismaService;
    const gatewayService = { isOnline: jest.fn().mockReturnValue(false) } as unknown as GatewayService;

    return { service: new OverviewService(prisma, gatewayService), sesiTransaksiFindMany, mitraFindMany, lokerFindMany };
  }

  describe('tren', () => {
    it('mengisi 14 hari terakhir dengan 0 untuk hari tanpa transaksi', async () => {
      const { service } = buildService({ sesiTransaksiFindMany: [] });

      const { data } = await service.tren();

      expect(data).toHaveLength(14);
      expect(data.every((d) => d.jumlahTransaksi === 0 && d.pendapatan === 0)).toBe(true);
    });

    it('mengelompokkan transaksi ke tanggal yang benar & menjumlah pendapatan', async () => {
      const hariIni = new Date().toISOString().slice(0, 10);
      const { service } = buildService({
        sesiTransaksiFindMany: [
          { createdAt: new Date(), nominal: 10_000 },
          { createdAt: new Date(), nominal: 5_000 },
        ],
      });

      const { data } = await service.tren();

      const bucketHariIni = data.find((d) => d.tanggal === hariIni);
      expect(bucketHariIni).toMatchObject({ jumlahTransaksi: 2, pendapatan: 15_000 });
    });
  });

  describe('mitraRingkasan — batched, bukan N+1', () => {
    it('SATU query sesiTransaksi.findMany walau ada banyak mitra', async () => {
      const mlA = { id: 'mitra-a', nama: 'Mitra A', createdAt: new Date(), units: [{ id: 'unit-a', lokers: [{ id: 'loker-a', status: LokerStatus.TERISI }] }] };
      const mlB = { id: 'mitra-b', nama: 'Mitra B', createdAt: new Date(), units: [{ id: 'unit-b', lokers: [{ id: 'loker-b', status: LokerStatus.TERSEDIA }] }] };
      const { service, sesiTransaksiFindMany } = buildService({
        mitraList: [mlA, mlB],
        sesiTransaksiFindMany: [
          { lokerId: 'loker-a', nominal: 100_000 },
          { lokerId: 'loker-b', nominal: 200_000 },
        ],
      });

      const { data } = await service.mitraRingkasan();

      expect(sesiTransaksiFindMany).toHaveBeenCalledTimes(1);
      expect(data.find((d) => d.mitraId === 'mitra-a')).toMatchObject({ jumlahUnit: 1, okupansiPersen: 100, pendapatanBulanIni: 100_000 });
      expect(data.find((d) => d.mitraId === 'mitra-b')).toMatchObject({ jumlahUnit: 1, okupansiPersen: 0, pendapatanBulanIni: 200_000 });
    });

    it('mitra tanpa loker sama sekali -> okupansiPersen 0, bukan NaN/error', async () => {
      const { service } = buildService({
        mitraList: [{ id: 'mitra-kosong', nama: 'Kosong', createdAt: new Date(), units: [] }],
      });

      const { data } = await service.mitraRingkasan();

      expect(data[0]).toMatchObject({ okupansiPersen: 0, pendapatanBulanIni: 0, jumlahUnit: 0 });
    });
  });

  describe('lokerList', () => {
    it('overdueStatus null untuk loker TERSEDIA (tidak ada sesi aktif dicek)', async () => {
      const { service } = buildService({
        lokerFindMany: [
          {
            id: 'loker-1',
            nomorLoker: '01',
            status: LokerStatus.TERSEDIA,
            lokerKategoriId: 'kat-1',
            unit: { kodeUnit: 'UNIT-01', lokasi: { nama: 'Lokasi A' }, durasiHarga: [] },
            sesiTransaksi: [],
          },
        ],
        lokerCount: 1,
      });

      const { data } = await service.lokerList(1, 25);

      expect(data[0].overdueStatus).toBeNull();
      expect(data[0].lastActivityAt).toBeNull();
    });

    it('loker TERISI dengan sesi aktif -> overdueStatus terisi dari waktuSelesai sesi terbaru', async () => {
      const { service } = buildService({
        lokerFindMany: [
          {
            id: 'loker-2',
            nomorLoker: '02',
            status: LokerStatus.TERISI,
            lokerKategoriId: 'kat-1',
            unit: { kodeUnit: 'UNIT-01', lokasi: { nama: 'Lokasi A' }, durasiHarga: [{ lokerKategoriId: 'kat-1', harga: 5000, durasiJam: 1, aktif: true }] },
            sesiTransaksi: [{ createdAt: new Date(), waktuSelesai: new Date(Date.now() + 60 * 60 * 1000) }],
          },
        ],
        lokerCount: 1,
      });

      const { data } = await service.lokerList(1, 25, LokerStatus.TERISI);

      expect(data[0].overdueStatus).toMatchObject({ overdue: false, suspended: false });
      expect(data[0].lastActivityAt).not.toBeNull();
    });
  });
});
