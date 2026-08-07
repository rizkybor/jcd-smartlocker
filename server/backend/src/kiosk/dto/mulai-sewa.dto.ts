import { z } from 'zod';

/**
 * docs/API-Contract-Smartbox.md §2 — POST /kiosk/sewa/mulai.
 *
 * `email` wajib SEMENTARA: OTP ambil-barang (Epic 4, §5.2) dikirim lewat
 * `OtpChannel` aktif (§8, SMB-207) — saat ini email/Brevo karena kredensial
 * WhatsApp BSP belum tersedia (Epic 0 SMB-006). Begitu channel WhatsApp
 * aktif, field ini boleh dilonggarkan jadi opsional (nomorHp sudah cukup
 * jadi tujuan OTP) — lihat kiosk-ambil.service.ts untuk pemilihan channel.
 */
export const mulaiSewaSchema = z.object({
  nomorHp: z
    .string()
    .regex(/^08\d{8,13}$/, 'Nomor HP harus format Indonesia, awalan 08, 10-15 digit.'),
  email: z.string().email('Format email tidak valid.'),
  unitDurasiHargaId: z.string().uuid('unitDurasiHargaId harus UUID yang valid.'),
});

export type MulaiSewaDto = z.infer<typeof mulaiSewaSchema>;
