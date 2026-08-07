/**
 * Abstraksi channel pengiriman OTP (docs/PRD-Smartbox.md §8, SMB-207) —
 * pola yang sama dengan `PaymentProvider` (payment/payment-provider.interface.ts):
 * kode yang mengirim OTP tidak pernah memanggil SDK/API provider langsung,
 * selalu lewat token `OTP_CHANNEL`.
 *
 * Channel aktif saat ini: EMAIL (Brevo) — SEMENTARA, karena kredensial
 * WhatsApp Business API/BSP belum tersedia (Epic 0 SMB-006). WhatsApp
 * channel sudah disiapkan strukturnya (`WhatsAppOtpChannel`) supaya
 * migrasi nanti tinggal ganti konfigurasi `OTP_CHANNEL_ACTIVE`, bukan
 * rombak alur ambil-barang (§5.2).
 */
export type SendOtpInput = {
  /** Alamat tujuan — email atau nomor HP, tergantung channel aktif. */
  destination: string;
  code: string;
  expiryMinutes: number;
};

export interface OtpChannel {
  readonly name: string;
  send(input: SendOtpInput): Promise<void>;
}

export const OTP_CHANNEL = Symbol('OTP_CHANNEL');
