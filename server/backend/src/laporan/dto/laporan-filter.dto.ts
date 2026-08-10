import { z } from 'zod';

/**
 * docs/API-Contract-Smartbox.md §5.3 — filter umum laporan transaksi/bagi
 * hasil. Semua opsional; tanggal dikirim sebagai ISO date string (UTC),
 * dikonversi ke `Date` di sini supaya service tidak perlu parsing manual.
 */
export const laporanFilterSchema = z.object({
  tanggalMulai: z.coerce.date().optional(),
  tanggalSelesai: z.coerce.date().optional(),
  lokasiId: z.string().uuid().optional(),
  mitraId: z.string().uuid().optional(),
});

export type LaporanFilterDto = z.infer<typeof laporanFilterSchema>;

export const exportLaporanSchema = laporanFilterSchema.extend({
  jenis: z.enum(['transaksi', 'bagi-hasil']),
});

export type ExportLaporanDto = z.infer<typeof exportLaporanSchema>;
