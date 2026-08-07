import { z } from 'zod';

/**
 * docs/API-Contract-Smartbox.md §2 — POST /kiosk/ambil/kirim-otp &
 * /kiosk/ambil/verifikasi-otp (§5.2 langkah 3).
 */
export const sesiIdSchema = z.object({
  sesiId: z.string().uuid('sesiId harus UUID yang valid.'),
});

export type SesiIdDto = z.infer<typeof sesiIdSchema>;

export const verifikasiOtpSchema = sesiIdSchema.extend({
  kode: z.string().regex(/^\d{6}$/, 'Kode OTP harus 6 digit angka.'),
});

export type VerifikasiOtpDto = z.infer<typeof verifikasiOtpSchema>;
