import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { PaymentProviderType, StatusBayar } from '@prisma/client';
import type {
  CreateQrisChargeInput,
  CreateQrisChargeResult,
  PaymentProvider,
  VerifyWebhookInput,
  WebhookVerificationResult,
} from '../payment-provider.interface';
import type { EnvConfig } from '../../config/env.validation';

/**
 * Implementasi Midtrans — Core API `/v2/charge` dengan `payment_type: "qris"`
 * (docs/PRD-Smartbox.md §8).
 *
 * BELUM DITES terhadap API Midtrans sungguhan — `MIDTRANS_SERVER_KEY` di
 * .env masih kosong (Epic 0 SMB-006). **Verifikasi ulang field
 * response/notification terbaru di dokumentasi Midtrans sebelum live.**
 *
 * Webhook: Midtrans mengirim `signature_key` di body notification, dihitung
 * `SHA512(order_id + status_code + gross_amount + server_key)` — kita
 * hitung ulang dan bandingkan (§9.3, "skema signature berbeda per
 * provider").
 */
@Injectable()
export class MidtransProvider implements PaymentProvider {
  readonly name = PaymentProviderType.MIDTRANS;
  private readonly logger = new Logger(MidtransProvider.name);
  private readonly serverKey: string | undefined;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.serverKey = config.get('MIDTRANS_SERVER_KEY', { infer: true });
  }

  async createQrisCharge(input: CreateQrisChargeInput): Promise<CreateQrisChargeResult> {
    if (!this.serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY belum di-set — tidak bisa buat charge Midtrans.');
    }

    const expirySeconds = input.expirySeconds ?? 300;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    const response = await fetch('https://api.midtrans.com/v2/charge', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        payment_type: 'qris',
        transaction_details: {
          order_id: input.idTransaksi,
          gross_amount: input.nominal,
        },
        qris: { acquirer: 'gopay' },
        custom_expiry: {
          expiry_duration: Math.ceil(expirySeconds / 60),
          unit: 'minute',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Midtrans createQrisCharge gagal (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as {
      transaction_id: string;
      actions?: { name: string; url: string }[];
    };

    const qrAction = data.actions?.find((a) => a.name === 'generate-qr-code');
    if (!qrAction) {
      throw new Error('Response Midtrans tidak berisi action generate-qr-code.');
    }

    return {
      providerRefId: data.transaction_id,
      qrString: qrAction.url,
      expiredAt: expiresAt,
    };
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<WebhookVerificationResult> {
    if (!this.serverKey) {
      return { valid: false, reason: 'MIDTRANS_SERVER_KEY belum dikonfigurasi di server.' };
    }

    const body = input.body as {
      order_id?: string;
      status_code?: string;
      gross_amount?: string;
      signature_key?: string;
      transaction_id?: string;
      transaction_status?: string;
      fraud_status?: string;
    };

    if (!body.order_id || !body.status_code || !body.gross_amount || !body.signature_key) {
      return { valid: false, reason: 'Payload notification Midtrans tidak lengkap.' };
    }

    const expectedSignature = this.computeSignature(
      body.order_id,
      body.status_code,
      body.gross_amount,
    );

    if (expectedSignature !== body.signature_key) {
      this.logger.warn('Webhook Midtrans ditolak: signature_key tidak cocok.');
      return { valid: false, reason: 'signature_key tidak valid.' };
    }

    if (!body.transaction_id) {
      return { valid: false, reason: 'Payload notification tidak berisi transaction_id.' };
    }

    return {
      valid: true,
      providerRefId: body.transaction_id,
      status: this.mapMidtransStatus(body.transaction_status, body.fraud_status),
    };
  }

  async getStatus(providerRefId: string): Promise<StatusBayar> {
    if (!this.serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY belum di-set.');
    }

    const response = await fetch(`https://api.midtrans.com/v2/${providerRefId}/status`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Midtrans getStatus gagal (${response.status}) untuk ${providerRefId}.`);
    }

    const data = (await response.json()) as {
      transaction_status?: string;
      fraud_status?: string;
    };
    return this.mapMidtransStatus(data.transaction_status, data.fraud_status);
  }

  private computeSignature(orderId: string, statusCode: string, grossAmount: string): string {
    return createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${this.serverKey}`)
      .digest('hex');
  }

  private mapMidtransStatus(
    transactionStatus: string | undefined,
    fraudStatus: string | undefined,
  ): StatusBayar {
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      return fraudStatus === 'challenge' ? StatusBayar.PENDING : StatusBayar.PAID;
    }
    if (transactionStatus === 'expire') return StatusBayar.EXPIRED;
    if (
      transactionStatus === 'deny' ||
      transactionStatus === 'cancel' ||
      transactionStatus === 'failure'
    ) {
      return StatusBayar.FAILED;
    }
    return StatusBayar.PENDING;
  }
}
