import { z } from 'zod';

/**
 * docs/PRD-Smartbox.md §12 poin 2 — rentang 0-100 inclusive. Divalidasi di
 * sini (Zod, respons cepat) DAN di database (CHECK constraint,
 * prisma/sql/constraints_and_rls.sql) — dua lapis, jangan andalkan salah
 * satu saja.
 */
export const ajukanSkemaSchema = z.object({
  persentase: z
    .number()
    .min(0, 'Persentase minimal 0.')
    .max(100, 'Persentase maksimal 100.'),
});

export type AjukanSkemaDto = z.infer<typeof ajukanSkemaSchema>;
