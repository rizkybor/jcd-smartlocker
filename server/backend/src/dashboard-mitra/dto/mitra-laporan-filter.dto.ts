import { z } from 'zod';

/**
 * docs/API-Contract-Smartbox.md §6 — GET/POST /mitra/laporan*.
 * TIDAK ada `mitraId` (selalu milik sendiri, dari token) atau `lokasiId`
 * bebas — kalau mitra punya >1 lokasi, filter lokasi tetap divalidasi
 * terhadap lokasi miliknya di service, bukan diterima mentah dari sini
 * (§5.5, §9.2 — isolasi ditegakkan di application layer).
 */
export const mitraLaporanFilterSchema = z.object({
  tanggalMulai: z.coerce.date().optional(),
  tanggalSelesai: z.coerce.date().optional(),
  lokasiId: z.string().uuid().optional(),
});

export type MitraLaporanFilterDto = z.infer<typeof mitraLaporanFilterSchema>;
