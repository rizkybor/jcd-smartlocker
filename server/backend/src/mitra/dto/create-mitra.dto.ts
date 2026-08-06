import { z } from 'zod';
import { TipeSkema } from '@prisma/client';

/**
 * docs/API-Contract-Smartbox.md §5.2 — POST /company/mitra: buat mitra +
 * relasi lokasi (MitraLokasi) sekaligus. Persentase revenue sharing TIDAK
 * diisi di sini — harus lewat alur ajukan/approve terpisah (§10, §12 poin 2)
 * meski saat pembuatan mitra sekalipun, supaya semua persentase yang
 * pernah berlaku selalu tercatat riwayatnya (MitraLokasiSkemaHistori).
 */
export const createMitraSchema = z.object({
  nama: z.string().min(1, 'Nama mitra tidak boleh kosong.'),
  kontak: z.string().optional(),
  lokasiId: z.string().uuid('lokasiId harus UUID lokasi yang valid.'),
  tipeSkema: z.nativeEnum(TipeSkema),
});

export type CreateMitraDto = z.infer<typeof createMitraSchema>;
