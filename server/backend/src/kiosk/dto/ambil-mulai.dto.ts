import { z } from 'zod';

/**
 * docs/API-Contract-Smartbox.md §2 — POST /kiosk/ambil/mulai (§5.2 langkah 2).
 */
export const ambilMulaiSchema = z.object({
  nomorHp: z
    .string()
    .regex(/^08\d{8,13}$/, 'Nomor HP harus format Indonesia, awalan 08, 10-15 digit.'),
});

export type AmbilMulaiDto = z.infer<typeof ambilMulaiSchema>;
