import { z } from 'zod';
import { TipeSkema } from '@prisma/client';
import { lokasiPilihanSchema } from '../../lokasi/dto/wilayah.dto';

/**
 * docs/API-Contract-Smartbox.md §5.2 — POST /company/mitra: buat mitra +
 * relasi lokasi (MitraLokasi) sekaligus. Persentase revenue sharing TIDAK
 * diisi di sini — harus lewat alur ajukan/approve terpisah (§10, §12 poin 2)
 * meski saat pembuatan mitra sekalipun, supaya semua persentase yang
 * pernah berlaku selalu tercatat riwayatnya (MitraLokasiSkemaHistori).
 *
 * `lokasi` (di luar cakupan PRD awal, permintaan bisnis langsung): boleh
 * REUSE Lokasi existing (`lokasiId`) atau bikin baru inline lewat wilayah
 * picker (`lokasiBaru`) — lihat `lokasi/dto/wilayah.dto.ts`.
 *
 * `akunMitra` (di luar cakupan PRD awal): bikin login Dashboard Mitra
 * SEKALIGUS saat mitra dibuat — dulu cuma bisa lewat seed script. Password
 * WAJIB diisi Super Admin langsung di form (bukan invite-link) supaya
 * mitra bisa langsung login tanpa bergantung email delivery.
 */
export const createMitraSchema = z
  .object({
    nama: z.string().min(1, 'Nama mitra tidak boleh kosong.'),
    kontak: z.string().optional(),
    tipeSkema: z.nativeEnum(TipeSkema),
    akunMitra: z.object({
      nama: z.string().min(1, 'Nama PIC akun mitra tidak boleh kosong.'),
      email: z.string().email('Format email tidak valid.'),
      password: z.string().min(8, 'Password minimal 8 karakter.'),
    }),
  })
  .and(lokasiPilihanSchema);

export type CreateMitraDto = z.infer<typeof createMitraSchema>;
