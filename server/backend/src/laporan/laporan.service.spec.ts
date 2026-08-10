import { LaporanService } from './laporan.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { SupabaseService } from '../supabase/supabase.service';

/**
 * SMB-1101 — unit test untuk aturan bisnis paling berisiko di bagiHasil():
 * persentase yang dipakai HARUS persentase yang berlaku SAAT transaksi
 * terjadi (skemaHistori), bukan persentase aktif sekarang (persentaseAktif).
 * Lihat docs/PRD-Smartbox.md §10, §12 poin 2, dan komentar di
 * laporan.service.ts baris 64-73.
 */
describe('LaporanService.bagiHasil', () => {
  function buildService(mitraLokasiList: unknown[], sesiPerCall: unknown[][]) {
    let call = 0;
    const prisma = {
      db: {
        mitraLokasi: { findMany: jest.fn().mockResolvedValue(mitraLokasiList) },
        sesiTransaksi: {
          findMany: jest.fn().mockImplementation(() => Promise.resolve(sesiPerCall[call++] ?? [])),
        },
      },
    } as unknown as PrismaService;
    const supabase = {} as SupabaseService;
    return new LaporanService(prisma, supabase);
  }

  function mitraLokasi(overrides: Record<string, unknown> = {}) {
    return {
      mitraId: 'mitra-1',
      lokasiId: 'lokasi-1',
      persentaseAktif: 30,
      mitra: { nama: 'Mitra Satu' },
      lokasi: {
        nama: 'Lokasi Satu',
        units: [{ lokers: [{ id: 'loker-1' }] }],
      },
      skemaHistori: [],
      ...overrides,
    };
  }

  const filter = { tanggalMulai: new Date('2026-01-01'), tanggalSelesai: new Date('2026-12-31') };

  it('pakai persentase histori yang berlaku pada waktu transaksi, bukan persentaseAktif sekarang', async () => {
    // Transaksi lama terjadi saat persentase masih 20%, sekarang sudah naik ke 30%.
    const ml = mitraLokasi({
      persentaseAktif: 30,
      skemaHistori: [
        { persentase: 20, berlakuDari: new Date('2026-01-01'), berlakuSampai: new Date('2026-06-01') },
        { persentase: 30, berlakuDari: new Date('2026-06-01'), berlakuSampai: null },
      ],
    });
    const service = buildService([ml], [[{ id: 't1', nominal: 100_000, createdAt: new Date('2026-03-01') }]]);

    const { data } = await service.bagiHasil(filter);

    expect(data[0].totalBagiHasilMitra).toBe(20_000); // 20% dari histori lama, bukan 30_000
    expect(data[0].totalBagiHasilSmartbox).toBe(80_000);
  });

  it('transaksi baru pakai persentase histori terbaru yang sedang berlaku', async () => {
    const ml = mitraLokasi({
      persentaseAktif: 30,
      skemaHistori: [
        { persentase: 20, berlakuDari: new Date('2026-01-01'), berlakuSampai: new Date('2026-06-01') },
        { persentase: 30, berlakuDari: new Date('2026-06-01'), berlakuSampai: null },
      ],
    });
    const service = buildService([ml], [[{ id: 't1', nominal: 100_000, createdAt: new Date('2026-07-01') }]]);

    const { data } = await service.bagiHasil(filter);

    expect(data[0].totalBagiHasilMitra).toBe(30_000);
  });

  it('fallback ke persentaseAktif kalau tidak ada histori yang cocok dengan waktu transaksi', async () => {
    const ml = mitraLokasi({ persentaseAktif: 25, skemaHistori: [] });
    const service = buildService([ml], [[{ id: 't1', nominal: 100_000, createdAt: new Date('2026-03-01') }]]);

    const { data } = await service.bagiHasil(filter);

    expect(data[0].totalBagiHasilMitra).toBe(25_000);
  });

  it('fallback ke 0 kalau persentaseAktif juga null', async () => {
    const ml = mitraLokasi({ persentaseAktif: null, skemaHistori: [] });
    const service = buildService([ml], [[{ id: 't1', nominal: 100_000, createdAt: new Date('2026-03-01') }]]);

    const { data } = await service.bagiHasil(filter);

    expect(data[0].totalBagiHasilMitra).toBe(0);
    expect(data[0].totalBagiHasilSmartbox).toBe(100_000);
  });

  it('batas berlakuDari bersifat inklusif (transaksi tepat di awal window ikut histori baru)', async () => {
    const ml = mitraLokasi({
      skemaHistori: [
        { persentase: 20, berlakuDari: new Date('2026-01-01'), berlakuSampai: new Date('2026-06-01') },
        { persentase: 30, berlakuDari: new Date('2026-06-01'), berlakuSampai: null },
      ],
    });
    const service = buildService([ml], [[{ id: 't1', nominal: 100_000, createdAt: new Date('2026-06-01') }]]);

    const { data } = await service.bagiHasil(filter);

    expect(data[0].totalBagiHasilMitra).toBe(30_000); // berlakuDari <= createdAt -> masuk histori baru
  });

  it('batas berlakuSampai bersifat eksklusif (transaksi tepat di akhir window ikut histori baru, bukan yang lama)', async () => {
    const ml = mitraLokasi({
      skemaHistori: [
        { persentase: 20, berlakuDari: new Date('2026-01-01'), berlakuSampai: new Date('2026-06-01') },
        { persentase: 30, berlakuDari: new Date('2026-06-01'), berlakuSampai: null },
      ],
    });
    // createdAt sama persis dengan berlakuSampai histori lama -> histori lama TIDAK cocok (pakai `>`, bukan `>=`)
    const service = buildService([ml], [[{ id: 't1', nominal: 100_000, createdAt: new Date('2026-06-01') }]]);

    const { data } = await service.bagiHasil(filter);

    expect(data[0].totalBagiHasilMitra).toBe(30_000);
  });

  it('mitraLokasi tanpa loker sama sekali dilewati (tidak muncul di hasil)', async () => {
    const ml = mitraLokasi({ lokasi: { nama: 'Lokasi Kosong', units: [] } });
    const service = buildService([ml], []);

    const { data } = await service.bagiHasil(filter);

    expect(data).toHaveLength(0);
  });

  it('totalBagiHasilMitra dan totalBagiHasilSmartbox dibulatkan dari SUM, bukan per-transaksi (menghindari drift pembulatan)', async () => {
    const ml = mitraLokasi({ persentaseAktif: 33 }); // 33% dari 3 transaksi ganjil -> banyak desimal
    const service = buildService(
      [ml],
      [
        [
          { id: 't1', nominal: 10_001, createdAt: new Date('2026-03-01') },
          { id: 't2', nominal: 10_003, createdAt: new Date('2026-03-02') },
          { id: 't3', nominal: 10_007, createdAt: new Date('2026-03-03') },
        ],
      ],
    );

    const { data } = await service.bagiHasil(filter);

    const totalNominal = 10_001 + 10_003 + 10_007;
    expect(data[0].totalNominal).toBe(totalNominal);
    // Kedua angka yang dibulatkan harus tetap menjumlah ke total nominal.
    expect(data[0].totalBagiHasilMitra + data[0].totalBagiHasilSmartbox).toBe(totalNominal);
  });

  it('jumlahTransaksi dan persentaseAktif dilaporkan apa adanya dari data mitraLokasi', async () => {
    const ml = mitraLokasi({ persentaseAktif: 40 });
    const service = buildService(
      [ml],
      [
        [
          { id: 't1', nominal: 50_000, createdAt: new Date('2026-03-01') },
          { id: 't2', nominal: 50_000, createdAt: new Date('2026-03-02') },
        ],
      ],
    );

    const { data } = await service.bagiHasil(filter);

    expect(data[0].jumlahTransaksi).toBe(2);
    expect(data[0].persentaseAktif).toBe(40);
  });
});
