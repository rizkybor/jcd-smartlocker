import { z } from 'zod';

/**
 * docs/API-Contract-Smartbox.md §2 — POST /kiosk/sewa/mulai.
 *
 * `email` wajib SEMENTARA: OTP ambil-barang (Epic 4, §5.2) dikirim lewat
 * `OtpChannel` aktif (§8, SMB-207) — saat ini email/Brevo karena kredensial
 * WhatsApp BSP belum tersedia (Epic 0 SMB-006). Begitu channel WhatsApp
 * aktif, field ini boleh dilonggarkan jadi opsional (nomorHp sudah cukup
 * jadi tujuan OTP) — lihat kiosk-ambil.service.ts untuk pemilihan channel.
 *
 * Fitur member RFID (di luar cakupan PRD awal): member "umum" (kode
 * unik/RFID, TIDAK terikat loker spesifik) tap kartu MENGGANTIKAN
 * nomorHp/email sebagai identitas — isi `memberId` sebagai gantinya
 * (didapat dari `POST /kiosk/rfid/scan`). Nomor HP/email TIDAK perlu lagi
 * dipakai untuk member, karena verifikasi ambil-barang mereka juga lewat
 * tap RFID ulang, bukan OTP (lihat kiosk-rfid.service.ts).
 */
/** Bentuk object mentah (sebelum `.refine()`) — diekspor supaya field-nya bisa di-`.pick()` (mis. test regex nomorHp bersama). */
export const mulaiSewaObjectSchema = z.object({
  nomorHp: z
    .string()
    .regex(/^08\d{8,13}$/, 'Nomor HP harus format Indonesia, awalan 08, 10-15 digit.')
    .optional(),
  email: z.string().email('Format email tidak valid.').optional(),
  memberId: z.string().uuid('memberId harus UUID yang valid.').optional(),
  unitDurasiHargaId: z.string().uuid('unitDurasiHargaId harus UUID yang valid.'),
});

export const mulaiSewaSchema = mulaiSewaObjectSchema.refine(
  (d) => !!d.memberId || (!!d.nomorHp && !!d.email),
  { message: 'Isi nomorHp+email (sewa biasa) ATAU memberId (sewa via RFID member) — salah satu wajib.' },
);

export type MulaiSewaDto = z.infer<typeof mulaiSewaSchema>;
