import { z } from 'zod';
import { wilayahSchema } from './wilayah.dto';

export const updateLokasiSchema = z.object({
  nama: z.string().min(1).optional(),
  alamat: z.string().min(1).optional(),
  timezone: z
    .string()
    .regex(/^[A-Za-z]+\/[A-Za-z_]+$/, 'Format timezone harus IANA, mis. "Asia/Jakarta".')
    .optional(),
  wilayah: wilayahSchema.optional(),
});

export type UpdateLokasiDto = z.infer<typeof updateLokasiSchema>;
