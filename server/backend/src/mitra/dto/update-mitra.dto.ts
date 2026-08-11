import { z } from 'zod';

/**
 * docs/API-Contract-Smartbox.md §5.2 — PATCH /company/mitra/:id.
 * Cuma data dasar — lokasi/tipeSkema/persentase TIDAK diubah lewat sini
 * (persentase harus lewat alur ajukan/approve, §10; relasi lokasi baru
 * belum ada endpoint terpisah, di luar cakupan tiket ini).
 */
export const updateMitraSchema = z.object({
  nama: z.string().min(1, 'Nama mitra tidak boleh kosong.').optional(),
  kontak: z.string().optional(),
  /** Fitur member RFID (di luar cakupan PRD awal) — akses menu kelola member di Dashboard Mitra, default false. */
  bolehKelolaMember: z.boolean().optional(),
});

export type UpdateMitraDto = z.infer<typeof updateMitraSchema>;
