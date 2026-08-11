import { z } from 'zod';

/**
 * Kode+nama wilayah administratif Indonesia (Provinsi/Kab-Kota/Kecamatan/
 * Kelurahan) — di luar cakupan PRD awal, permintaan bisnis langsung.
 * Dipilih via cascading picker di frontend dari dataset publik
 * emsifa/api-wilayah-indonesia — backend cuma menyimpan hasil pilihan,
 * TIDAK memvalidasi ulang ke API itu (lihat catatan model `Lokasi` di
 * schema.prisma). Schema ini dipakai bersama oleh `create-lokasi.dto.ts`,
 * `mitra/dto/create-mitra.dto.ts`, dan `unit/dto/create-unit.dto.ts`.
 */
export const wilayahSchema = z.object({
  provinsiKode: z.string().min(1, 'Provinsi wajib dipilih.'),
  provinsiNama: z.string().min(1),
  kabupatenKode: z.string().min(1, 'Kabupaten/Kota wajib dipilih.'),
  kabupatenNama: z.string().min(1),
  kecamatanKode: z.string().min(1, 'Kecamatan wajib dipilih.'),
  kecamatanNama: z.string().min(1),
  kelurahanKode: z.string().min(1, 'Kelurahan wajib dipilih.'),
  kelurahanNama: z.string().min(1),
});

export type WilayahDto = z.infer<typeof wilayahSchema>;

/**
 * Union "pakai Lokasi yang sudah ada" vs "buat Lokasi baru" — dipakai
 * Mitra & Unit creation, keduanya sekarang boleh reuse Lokasi existing
 * ATAU membuat baru inline lewat wilayah picker (§ konfirmasi bisnis).
 */
export const lokasiBaruSchema = z.object({
  nama: z.string().min(1, 'Nama lokasi tidak boleh kosong.'),
  alamat: z.string().min(1, 'Alamat tidak boleh kosong.'),
  timezone: z
    .string()
    .min(1, 'Timezone wajib diisi, mis. "Asia/Jakarta".')
    .regex(/^[A-Za-z]+\/[A-Za-z_]+$/, 'Format timezone harus IANA, mis. "Asia/Jakarta".'),
  wilayah: wilayahSchema,
});

export type LokasiBaruDto = z.infer<typeof lokasiBaruSchema>;

export const lokasiPilihanSchema = z
  .object({
    lokasiId: z.string().uuid('lokasiId harus UUID yang valid.').optional(),
    lokasiBaru: lokasiBaruSchema.optional(),
  })
  .refine((d) => !!d.lokasiId !== !!d.lokasiBaru, {
    message: 'Isi salah satu: lokasiId (pakai lokasi existing) atau lokasiBaru (buat lokasi baru) — tidak boleh dua-duanya atau kosong.',
  });

export type LokasiPilihanDto = z.infer<typeof lokasiPilihanSchema>;
