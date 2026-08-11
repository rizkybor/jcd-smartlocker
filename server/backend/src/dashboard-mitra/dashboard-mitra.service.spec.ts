import { ForbiddenException } from '@nestjs/common';
import { DashboardMitraService } from './dashboard-mitra.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { SupabaseService } from '../supabase/supabase.service';
import type { GatewayService } from '../gateway/gateway.service';
import type { AuthenticatedMitraUser } from '../auth/types';

/**
 * SMB-1105 — isolasi data Dashboard Mitra DITEGAKKAN DI APLIKASI, bukan RLS
 * Postgres (backend connect sebagai role `postgres`, bypass RLS — lihat
 * komentar di dashboard-mitra.service.ts baris 20-27). Test ini
 * memformalkan verifikasi yang sebelumnya cuma dilakukan manual lewat
 * live-DB smoke test saat Epic 7: setiap query WAJIB di-scope ke
 * `AkunMitraLokasi` milik actor, dan `lokasiId` yang di-supply caller lewat
 * query param WAJIB ditolak (403) kalau bukan milik akun mitra tsb (defense
 * terhadap IDOR).
 */
describe('DashboardMitraService — isolasi data mitra', () => {
  const actor: AuthenticatedMitraUser = {
    kind: 'mitra',
    id: 'akun-mitra-1',
    supabaseAuthUid: 'uid-1',
    email: 'mitra@b.com',
    nama: 'Mitra Satu',
    mitraId: 'mitra-1',
  };

  function buildService(opts: {
    accessibleLokasiIds?: string[];
    units?: unknown[];
    sesiTransaksi?: unknown[];
    mitraLokasi?: unknown[];
  } = {}) {
    const akunMitraLokasiFindMany = jest
      .fn()
      .mockResolvedValue((opts.accessibleLokasiIds ?? ['lokasi-milik-1', 'lokasi-milik-2']).map((lokasiId) => ({ lokasiId })));
    const unitFindMany = jest.fn().mockResolvedValue(opts.units ?? []);
    const unitCount = jest.fn().mockResolvedValue((opts.units ?? []).length);
    const sesiFindMany = jest.fn().mockResolvedValue(opts.sesiTransaksi ?? []);
    const sesiCount = jest.fn().mockResolvedValue((opts.sesiTransaksi ?? []).length);
    const sesiAggregate = jest.fn().mockResolvedValue({ _sum: { nominal: 0 } });
    const lokerGroupBy = jest.fn().mockResolvedValue([]);
    const mitraLokasiFindMany = jest.fn().mockResolvedValue(opts.mitraLokasi ?? []);

    const prisma = {
      db: {
        akunMitraLokasi: { findMany: akunMitraLokasiFindMany },
        unit: { findMany: unitFindMany, count: unitCount },
        sesiTransaksi: { findMany: sesiFindMany, count: sesiCount, aggregate: sesiAggregate },
        loker: { groupBy: lokerGroupBy },
        mitraLokasi: { findMany: mitraLokasiFindMany },
        mitra: { findUnique: jest.fn() },
      },
    } as unknown as PrismaService;

    const supabase = {} as SupabaseService;
    const gatewayService = { isOnline: jest.fn().mockReturnValue(false) } as unknown as GatewayService;

    return {
      service: new DashboardMitraService(prisma, supabase, gatewayService),
      unitFindMany,
      sesiFindMany,
      mitraLokasiFindMany,
    };
  }

  describe('units() — cuma lokasi milik actor', () => {
    it('scope WHERE ke lokasiId yang benar-benar milik actor (dari AkunMitraLokasi), bukan semua lokasi', async () => {
      const { service, unitFindMany } = buildService({ accessibleLokasiIds: ['lokasi-milik-1', 'lokasi-milik-2'] });

      await service.units(actor, 1, 20);

      expect(unitFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { lokasiId: { in: ['lokasi-milik-1', 'lokasi-milik-2'] } } }),
      );
    });

    it('tidak pernah mengembalikan unitKey (kredensial kiosk) ke akun mitra', async () => {
      const { service } = buildService({
        units: [{ id: 'u1', kodeUnit: 'UNIT-01', unitKey: 'rahasia-jangan-bocor', lokasiId: 'lokasi-milik-1' }],
      });

      const result = await service.units(actor, 1, 20);

      expect(result.data[0]).not.toHaveProperty('unitKey');
    });

    it('mitra tanpa lokasi terhubung sama sekali -> WHERE in: [] (tidak diam-diam lihat semua)', async () => {
      const { service, unitFindMany } = buildService({ accessibleLokasiIds: [] });

      await service.units(actor, 1, 20);

      expect(unitFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { lokasiId: { in: [] } } }));
    });
  });

  describe('laporan() — resolveLokasiScope menolak IDOR lewat query param lokasiId', () => {
    it('lempar ForbiddenException LOKASI_BUKAN_MILIK_ANDA kalau lokasiId di query bukan milik actor', async () => {
      const { service } = buildService({ accessibleLokasiIds: ['lokasi-milik-1'] });

      await expect(
        service.laporan(actor, { lokasiId: 'lokasi-BUKAN-milik-mitra-lain' } as never, 1, 20),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('menerima lokasiId di query kalau memang milik actor, dan scope WHERE cuma ke lokasi itu (bukan semua lokasi milik actor)', async () => {
      const { service, sesiFindMany } = buildService({ accessibleLokasiIds: ['lokasi-milik-1', 'lokasi-milik-2'] });

      await service.laporan(actor, { lokasiId: 'lokasi-milik-1' } as never, 1, 20);

      expect(sesiFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ loker: { unit: { lokasiId: { in: ['lokasi-milik-1'] } } } }),
        }),
      );
    });

    it('tanpa filter lokasiId -> scope ke SEMUA lokasi milik actor (bukan satu pun di luar itu)', async () => {
      const { service, sesiFindMany } = buildService({ accessibleLokasiIds: ['lokasi-milik-1', 'lokasi-milik-2'] });

      await service.laporan(actor, {} as never, 1, 20);

      expect(sesiFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ loker: { unit: { lokasiId: { in: ['lokasi-milik-1', 'lokasi-milik-2'] } } } }),
        }),
      );
    });
  });

  describe('hitungBagiHasil (lewat laporan()) — mitraLokasi query di-scope ke actor.mitraId, bukan mitraId dari input', () => {
    it('selalu query mitraLokasi dengan mitraId = actor.mitraId, walau actor punya banyak lokasi', async () => {
      const { service, mitraLokasiFindMany } = buildService({ accessibleLokasiIds: ['lokasi-milik-1'] });

      await service.laporan(actor, {} as never, 1, 20);

      expect(mitraLokasiFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ mitraId: 'mitra-1' }) }),
      );
    });

    it('batched jadi SATU query sesiTransaksi.findMany untuk hitungBagiHasil walau ada banyak mitraLokasi (bukan N+1)', async () => {
      const mlA = {
        id: 'ml-a',
        persentaseAktif: 20,
        lokasi: { units: [{ lokers: [{ id: 'loker-a' }] }] },
        skemaHistori: [],
      };
      const mlB = {
        id: 'ml-b',
        persentaseAktif: 30,
        lokasi: { units: [{ lokers: [{ id: 'loker-b' }] }] },
        skemaHistori: [],
      };
      const { service, sesiFindMany } = buildService({ accessibleLokasiIds: ['lokasi-milik-1'], mitraLokasi: [mlA, mlB] });
      // Panggilan pertama = daftar transaksi paginated (laporan()), kedua =
      // query batched hitungBagiHasil() — urutan sesuai Promise.all di kode.
      sesiFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { lokerId: 'loker-a', nominal: 100_000, createdAt: new Date('2026-03-01') },
          { lokerId: 'loker-b', nominal: 200_000, createdAt: new Date('2026-03-01') },
        ]);

      const result = await service.laporan(actor, {} as never, 1, 20);

      // sesiFindMany dipanggil 2x total: 1x untuk daftar transaksi paginated
      // (laporan()), 1x untuk hitungBagiHasil() — BUKAN N+1 per mitraLokasi.
      expect(sesiFindMany).toHaveBeenCalledTimes(2);
      expect(result.bagiHasil.jumlahTransaksi).toBe(2);
      expect(result.bagiHasil.totalNominal).toBe(300_000);
      // 20% dari 100rb + 30% dari 200rb = 20.000 + 60.000 = 80.000
      expect(result.bagiHasil.totalBagiHasilMitra).toBe(80_000);
    });
  });

  describe('overview() — mitra tanpa lokasi tidak error, cuma hasil kosong', () => {
    it('mengembalikan semua metrik 0 kalau accessibleLokasiIds kosong (tidak query lain sama sekali)', async () => {
      const { service, unitFindMany } = buildService({ accessibleLokasiIds: [] });

      const result = await service.overview(actor);

      expect(result.jumlahLokasi).toBe(0);
      expect(result.jumlahUnit).toBe(0);
      expect(unitFindMany).not.toHaveBeenCalled();
    });
  });
});
