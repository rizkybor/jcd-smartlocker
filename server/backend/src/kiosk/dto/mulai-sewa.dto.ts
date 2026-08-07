import { z } from 'zod';

/**
 * docs/API-Contract-Smartbox.md §2 — POST /kiosk/sewa/mulai.
 */
export const mulaiSewaSchema = z.object({
  nomorHp: z
    .string()
    .regex(/^08\d{8,13}$/, 'Nomor HP harus format Indonesia, awalan 08, 10-15 digit.'),
  unitDurasiHargaId: z.string().uuid('unitDurasiHargaId harus UUID yang valid.'),
});

export type MulaiSewaDto = z.infer<typeof mulaiSewaSchema>;
