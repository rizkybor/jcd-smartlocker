import { z } from 'zod';

/**
 * Member RFID/kode unik (fitur di luar cakupan PRD awal — permintaan bisnis
 * langsung, lihat catatan model `Member` di schema.prisma). Dua schema
 * terpisah untuk dua jalur akses:
 * - Super Admin (`/company/members`): boleh isi `lokerId` (ikat EKSKLUSIF
 *   ke 1 loker tertentu, gratis, bebas buka kapan saja tanpa denda) ATAU
 *   `diskonPersen` (member umum, diskon tarif sewa normal) — TIDAK boleh
 *   dua-duanya sekaligus, dan salah satu WAJIB diisi.
 * - Mitra (`/mitra/members`): HANYA boleh bikin member umum (diskonPersen),
 *   tidak pernah `lokerId` — pengikatan loker spesifik cuma hak Super Admin
 *   (menyangkut kapasitas publik loker milik mitra, bukan cuma urusan
 *   internal mitra itu sendiri).
 */
export const createMemberSuperAdminSchema = z
  .object({
    mitraId: z.string().uuid('mitraId harus UUID yang valid.'),
    kode: z.string().min(1, 'Kode RFID/unik wajib diisi.'),
    nama: z.string().min(1, 'Nama member wajib diisi.'),
    kontak: z.string().optional(),
    lokerId: z.string().uuid('lokerId harus UUID yang valid.').optional(),
    diskonPersen: z.number().min(0).max(100).optional(),
  })
  .refine((d) => !(d.lokerId && d.diskonPersen !== undefined), {
    message: 'Isi salah satu: lokerId (member eksklusif, gratis) atau diskonPersen (member umum) — tidak boleh dua-duanya.',
  })
  .refine((d) => d.lokerId !== undefined || d.diskonPersen !== undefined, {
    message: 'Wajib isi salah satu: lokerId (member eksklusif) atau diskonPersen (member umum).',
  });

export type CreateMemberSuperAdminDto = z.infer<typeof createMemberSuperAdminSchema>;

export const updateMemberSuperAdminSchema = z
  .object({
    nama: z.string().min(1).optional(),
    kontak: z.string().optional(),
    lokerId: z.string().uuid().nullable().optional(),
    diskonPersen: z.number().min(0).max(100).nullable().optional(),
    aktif: z.boolean().optional(),
  })
  .refine((d) => !(d.lokerId && d.diskonPersen), {
    message: 'Isi salah satu: lokerId (member eksklusif) atau diskonPersen (member umum) — tidak boleh dua-duanya.',
  });

export type UpdateMemberSuperAdminDto = z.infer<typeof updateMemberSuperAdminSchema>;

/** Mitra HANYA boleh kelola member umum (diskon) — tidak pernah lokerId (§ konfirmasi bisnis). */
export const createMemberMitraSchema = z.object({
  kode: z.string().min(1, 'Kode RFID/unik wajib diisi.'),
  nama: z.string().min(1, 'Nama member wajib diisi.'),
  kontak: z.string().optional(),
  diskonPersen: z.number().min(0).max(100),
});

export type CreateMemberMitraDto = z.infer<typeof createMemberMitraSchema>;

export const updateMemberMitraSchema = z.object({
  nama: z.string().min(1).optional(),
  kontak: z.string().optional(),
  diskonPersen: z.number().min(0).max(100).optional(),
  aktif: z.boolean().optional(),
});

export type UpdateMemberMitraDto = z.infer<typeof updateMemberMitraSchema>;
