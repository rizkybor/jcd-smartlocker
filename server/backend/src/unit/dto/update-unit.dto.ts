import { z } from 'zod';
import { ModePemakaian } from '@prisma/client';

/**
 * docs/API-Contract-Smartbox.md §5.1 — PATCH /company/units/:id.
 * `durasiHarga`, kalau dikirim, di-SYNC (bukan replace destruktif): entri
 * dengan `id` yang cocok di-update, entri tanpa `id` dibuat baru, entri
 * lama yang tidak disebutkan lagi di-nonaktifkan (`aktif: false`) —
 * BUKAN dihapus, karena `SesiTransaksi` historis masih mereferensikan
 * baris itu (§6, integritas riwayat transaksi/laporan).
 */
export const updateUnitSchema = z.object({
  varianKompartemen: z.string().optional(),
  modePemakaian: z.nativeEnum(ModePemakaian).optional(),
  aktif: z.boolean().optional(),
  durasiHarga: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        durasiJam: z.number().int().min(1),
        harga: z.number().nonnegative(),
      }),
    )
    .optional(),
});

export type UpdateUnitDto = z.infer<typeof updateUnitSchema>;

export const deleteUnitSchema = z.object({
  alasan: z.string().min(1, 'Alasan wajib diisi untuk menonaktifkan unit.'),
});

export type DeleteUnitDto = z.infer<typeof deleteUnitSchema>;
