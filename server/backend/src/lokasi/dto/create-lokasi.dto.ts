import { z } from 'zod';
import { wilayahSchema } from './wilayah.dto';

/**
 * docs/PRD-Smartbox.md §7.2 — timezone wajib diisi eksplisit, jangan
 * asumsikan default. Validasi format IANA dasar (mis. "Asia/Jakarta"),
 * validasi penuh (nama zona benar-benar dikenal) dicek di service pakai
 * `Intl.supportedValuesOf('timeZone')`. Wilayah administratif
 * (Provinsi/Kab-Kota/Kecamatan/Kelurahan) — lihat `wilayah.dto.ts`.
 */
export const createLokasiSchema = z.object({
  nama: z.string().min(1, 'Nama lokasi tidak boleh kosong.'),
  alamat: z.string().min(1, 'Alamat tidak boleh kosong.'),
  timezone: z
    .string()
    .min(1, 'Timezone wajib diisi, mis. "Asia/Jakarta".')
    .regex(/^[A-Za-z]+\/[A-Za-z_]+$/, 'Format timezone harus IANA, mis. "Asia/Jakarta".'),
  wilayah: wilayahSchema,
});

export type CreateLokasiDto = z.infer<typeof createLokasiSchema>;
