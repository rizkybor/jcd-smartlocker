import { z } from 'zod';
import { ModePemakaian } from '@prisma/client';

/**
 * Prasyarat untuk Kiosk API (Epic 3) — belum jadi ticket Epic tersendiri
 * di docs/Epics-Smartbox.md (itu Epic 6, SMB-603), dibuat minimal di sini
 * dengan alasan yang sama seperti LokasiModule/MitraModule di Epic 1: Kiosk
 * API butuh Unit + Loker + UnitDurasiHarga nyata untuk ditest end-to-end.
 *
 * Satu request membuat Unit + N baris Loker (nomor 01..N) + pilihan
 * durasi/harga sekaligus, supaya "unit siap dipakai kiosk" adalah satu
 * langkah, bukan beberapa endpoint terpisah yang harus dipanggil urut.
 */
export const createUnitSchema = z.object({
  lokasiId: z.string().uuid('lokasiId harus UUID lokasi yang valid.'),
  kodeUnit: z.string().min(1, 'kodeUnit tidak boleh kosong.'),
  varianKompartemen: z.string().optional(),
  jumlahLoker: z.number().int().min(1).max(100),
  modePemakaian: z.nativeEnum(ModePemakaian).default(ModePemakaian.BERBAYAR),
  durasiHarga: z
    .array(
      z.object({
        durasiJam: z.number().int().min(1),
        harga: z.number().nonnegative(),
      }),
    )
    .min(1, 'Minimal satu pilihan durasi & harga.'),
});

export type CreateUnitDto = z.infer<typeof createUnitSchema>;
