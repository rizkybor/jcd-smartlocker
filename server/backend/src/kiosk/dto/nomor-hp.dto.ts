import { z } from 'zod';

/**
 * docs/PRD-Smartbox.md §5.1 langkah 3 — "awalan 08, min 10 digit".
 */
export const nomorHpSchema = z.object({
  nomorHp: z
    .string()
    .regex(/^08\d{8,13}$/, 'Nomor HP harus format Indonesia, awalan 08, 10-15 digit.'),
});

export type NomorHpDto = z.infer<typeof nomorHpSchema>;
