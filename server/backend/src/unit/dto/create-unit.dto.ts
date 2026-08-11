import { z } from 'zod';
import { ModePemakaian } from '@prisma/client';
import { lokasiPilihanSchema } from '../../lokasi/dto/wilayah.dto';

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

/**
 * `mitraId` (owner, di luar cakupan PRD awal, § konfirmasi bisnis) —
 * sumber kebenaran LANGSUNG kepemilikan Unit, terpisah dari `lokasi`
 * (tempat unit ditaruh secara fisik, boleh reuse existing atau bikin baru
 * inline lewat wilayah picker — lihat `lokasi/dto/wilayah.dto.ts`).
 */
export const createUnitSchema = z
  .object({
    mitraId: z.string().uuid('mitraId (owner) harus UUID mitra yang valid.'),
    kodeUnit: z.string().min(1, 'kodeUnit tidak boleh kosong.'),
    varianKompartemen: z.string().optional(),
    modePemakaian: z.nativeEnum(ModePemakaian).default(ModePemakaian.BERBAYAR),
    kategori: z.array(kategoriInputSchema).min(1, 'Minimal satu kategori ukuran loker.'),
  })
  .and(lokasiPilihanSchema);

export type CreateUnitDto = z.infer<typeof createUnitSchema>;
