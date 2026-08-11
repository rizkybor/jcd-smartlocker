import { z } from 'zod';
import { ModePemakaian } from '@prisma/client';

/**
 * docs/API-Contract-Smartbox.md §5.1 — PATCH /company/units/:id.
 *
 * `kategori`, kalau dikirim, di-SYNC per kategori (bukan replace
 * destruktif) — sama seperti pola lama untuk `durasiHarga` sebelum fitur
 * kategori ukuran ditambahkan:
 * - Kategori dengan `id` yang cocok: update nama/ukuran, lalu `durasiHarga`
 *   di dalamnya di-sync (entri ber-`id` di-update, tanpa `id` dibuat baru,
 *   entri lama yang tidak disebut lagi di-nonaktifkan `aktif: false` —
 *   BUKAN dihapus, `SesiTransaksi` historis masih mereferensikan baris itu).
 * - Kategori TANPA `id`: kategori BARU, dibuat lengkap dengan `jumlahLoker`
 *   loker baru + `durasiHarga` awal. Menambah loker fisik ke kategori yang
 *   SUDAH ADA tidak didukung lewat endpoint ini (provisioning hardware
 *   lanjutan di luar cakupan form ini) — kalau perlu, buat kategori baru.
 */
export const updateUnitSchema = z.object({
  varianKompartemen: z.string().optional(),
  modePemakaian: z.nativeEnum(ModePemakaian).optional(),
  aktif: z.boolean().optional(),
  kategori: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        nama: z.string().min(1, 'Nama kategori (ukuran loker) wajib diisi.'),
        ukuranWMm: z.number().positive().optional(),
        ukuranHMm: z.number().positive().optional(),
        /** Wajib kalau kategori baru (tanpa `id`) — diabaikan kalau kategori sudah ada. */
        jumlahLoker: z.number().int().min(1).max(100).optional(),
        durasiHarga: z
          .array(
            z.object({
              id: z.string().uuid().optional(),
              durasiJam: z.number().int().min(1),
              harga: z.number().nonnegative(),
            }),
          )
          .min(1, 'Minimal satu pilihan durasi & harga per kategori.'),
      }),
    )
    .optional(),
});

export type UpdateUnitDto = z.infer<typeof updateUnitSchema>;

export const deleteUnitSchema = z.object({
  alasan: z.string().min(1, 'Alasan wajib diisi untuk menonaktifkan unit.'),
});

export type DeleteUnitDto = z.infer<typeof deleteUnitSchema>;
