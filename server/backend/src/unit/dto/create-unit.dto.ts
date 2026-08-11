import { z } from 'zod';
import { ModePemakaian } from '@prisma/client';

/**
 * Prasyarat untuk Kiosk API (Epic 3) — belum jadi ticket Epic tersendiri
 * di docs/Epics-Smartbox.md (itu Epic 6, SMB-603), dibuat minimal di sini
 * dengan alasan yang sama seperti LokasiModule/MitraModule di Epic 1: Kiosk
 * API butuh Unit + Loker + UnitDurasiHarga nyata untuk ditest end-to-end.
 *
 * Fitur harga & pilihan per ukuran loker (di luar cakupan PRD awal —
 * permintaan bisnis langsung, §8.3 sudah mengasumsikan satu unit fisik
 * BISA punya loker beragam ukuran): satu unit dibuat dengan >=1
 * `kategori` (ukuran loker), masing-masing kategori punya jumlah loker &
 * daftar durasi/harga SENDIRI — bukan satu daftar harga rata untuk semua
 * loker di unit itu.
 */
const kategoriInputSchema = z.object({
  nama: z.string().min(1, 'Nama kategori (ukuran loker) wajib diisi.'),
  ukuranWMm: z.number().positive().optional(),
  ukuranHMm: z.number().positive().optional(),
  jumlahLoker: z.number().int().min(1).max(100),
  durasiHarga: z
    .array(
      z.object({
        durasiJam: z.number().int().min(1),
        harga: z.number().nonnegative(),
      }),
    )
    .min(1, 'Minimal satu pilihan durasi & harga per kategori.'),
});

export const createUnitSchema = z.object({
  lokasiId: z.string().uuid('lokasiId harus UUID lokasi yang valid.'),
  kodeUnit: z.string().min(1, 'kodeUnit tidak boleh kosong.'),
  varianKompartemen: z.string().optional(),
  modePemakaian: z.nativeEnum(ModePemakaian).default(ModePemakaian.BERBAYAR),
  kategori: z.array(kategoriInputSchema).min(1, 'Minimal satu kategori ukuran loker.'),
});

export type CreateUnitDto = z.infer<typeof createUnitSchema>;
