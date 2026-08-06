import { z } from 'zod';

/**
 * docs/API-Contract-Smartbox.md §5.5 — POST /company/emergency-unlock-log.
 * Staff (atau Super Admin) mencatat MANUAL setelah kejadian fisik di
 * lapangan (docs/PRD-Smartbox.md §5.3, §8.1) — waktuKejadian bisa beda dari
 * waktu pencatatan (`disinkronkanAt`, di-set server saat create).
 */
export const createEmergencyUnlockSchema = z.object({
  lokerId: z.string().uuid('lokerId harus UUID loker yang valid.'),
  catatan: z.string().optional(),
  waktuKejadian: z.coerce.date({
    errorMap: () => ({ message: 'waktuKejadian wajib diisi, format ISO 8601.' }),
  }),
});

export type CreateEmergencyUnlockDto = z.infer<typeof createEmergencyUnlockSchema>;
