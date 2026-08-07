import { PaymentProviderType, StatusBayar } from '@prisma/client';

/**
 * Abstraksi payment provider (docs/PRD-Smartbox.md §8, §9.3;
 * docs/API-Contract-Smartbox.md §3). Kode transaksi (Epic 3, alur sewa
 * kiosk) selalu memanggil interface ini lewat token `PAYMENT_PROVIDER`
 * (payment.module.ts) — TIDAK PERNAH memanggil SDK Xendit/Midtrans
 * langsung, supaya penggantian/penambahan provider tidak menyentuh logic
 * transaksi inti (§8: "bisa ganti-ganti provider").
 */

export type CreateQrisChargeInput = {
  /** ID transaksi internal yang ditampilkan ke penyewa (SesiTransaksi.idTransaksi). */
  idTransaksi: string;
  /** Nominal dalam Rupiah, angka bulat (bukan sen). */
  nominal: number;
  /** Detik sebelum QR kedaluwarsa — default 300 (5 menit, §5.1). */
  expirySeconds?: number;
};

export type CreateQrisChargeResult = {
  /** ID transaksi di sisi provider — disimpan ke SesiTransaksi.paymentProviderRefId. */
  providerRefId: string;
  /** String QRIS mentah (dipakai kiosk untuk render QR code sendiri). */
  qrString: string;
  expiredAt: Date;
};

export type VerifyWebhookInput = {
  /** Header request webhook mentah (untuk verifikasi token/signature). */
  headers: Record<string, string | string[] | undefined>;
  /** Body request webhook — sudah di-parse JSON oleh Express, tapi provider
   * tertentu (Midtrans) butuh field mentahnya untuk hitung ulang signature. */
  body: Record<string, unknown>;
};

export type WebhookVerificationResult =
  | {
      valid: true;
      providerRefId: string;
      status: StatusBayar;
    }
  | {
      valid: false;
      reason: string;
    };

export interface PaymentProvider {
  readonly name: PaymentProviderType;
  createQrisCharge(input: CreateQrisChargeInput): Promise<CreateQrisChargeResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<WebhookVerificationResult>;
  getStatus(providerRefId: string): Promise<StatusBayar>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
