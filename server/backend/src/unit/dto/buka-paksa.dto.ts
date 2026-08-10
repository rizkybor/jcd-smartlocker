import { z } from 'zod';

/**
 * docs/API-Contract-Smartbox.md §5.1 — POST /company/units/:id/buka-paksa.
 * Wajib alasan — dicatat ke LOG_AKTIVITAS kategori keamanan (§7.1).
 */
export const bukaPaksaSchema = z.object({
  lokerId: z.string().uuid('lokerId harus UUID yang valid.'),
  alasan: z.string().min(1, 'Alasan wajib diisi.'),
});

export type BukaPaksaDto = z.infer<typeof bukaPaksaSchema>;
