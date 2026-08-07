import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
 * Implementasi Xendit — QR Codes API (docs/PRD-Smartbox.md §8).
 *
 * BELUM DITES terhadap API Xendit sungguhan — `XENDIT_SECRET_KEY` di .env
 * masih kosong (belum ada akun sandbox Xendit, Epic 0 SMB-006). Struktur
 * request/response di bawah mengikuti dokumentasi resmi Xendit QR Codes API
 * per pengetahuan implementasi ini ditulis — **verifikasi ulang field
 * response terbaru di dashboard/dokumentasi Xendit sebelum dipakai live**,
 * endpoint pihak ketiga bisa berubah.
 *
 * Webhook: Xendit mengirim header `x-callback-token` yang harus persis
 * sama dengan token yang dikonfigurasi di Xendit Dashboard (disimpan di
 * `XENDIT_WEBHOOK_TOKEN`) — perbandingan string langsung, bukan HMAC.
 */
@Injectable()
export class XenditProvider implements PaymentProvider {
  readonly name = PaymentProviderType.XENDIT;
  private readonly logger = new Logger(XenditProvider.name);
  private readonly secretKey: string | undefined;
  private readonly webhookToken: string | undefined;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.secretKey = config.get('XENDIT_SECRET_KEY', { infer: true });
    this.webhookToken = config.get('XENDIT_WEBHOOK_TOKEN', { infer: true });
  }

  async createQrisCharge(input: CreateQrisChargeInput): Promise<CreateQrisChargeResult> {
    if (!this.secretKey) {
      throw new Error('XENDIT_SECRET_KEY belum di-set — tidak bisa buat charge Xendit.');
    }

    const expirySeconds = input.expirySeconds ?? 300;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    const response = await fetch('https://api.xendit.co/qr_codes', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference_id: input.idTransaksi,
        type: 'DYNAMIC',
        currency: 'IDR',
        amount: input.nominal,
        expires_at: expiresAt.toISOString(),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Xendit createQrisCharge gagal (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as { id: string; qr_string: string };

    return {
      providerRefId: data.id,
      qrString: data.qr_string,
      expiredAt: expiresAt,
    };
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<WebhookVerificationResult> {
    if (!this.webhookToken) {
      return { valid: false, reason: 'XENDIT_WEBHOOK_TOKEN belum dikonfigurasi di server.' };
    }

    const receivedToken = input.headers['x-callback-token'];
    if (receivedToken !== this.webhookToken) {
      this.logger.warn('Webhook Xendit ditolak: x-callback-token tidak cocok.');
      return { valid: false, reason: 'x-callback-token tidak valid.' };
    }

    const body = input.body as {
      data?: { qr_id?: string; id?: string; status?: string };
      event?: string;
    };
    const providerRefId = body.data?.qr_id ?? body.data?.id;
    if (!providerRefId) {
      return { valid: false, reason: 'Payload webhook tidak berisi qr_id/id.' };
    }

    return {
      valid: true,
      providerRefId,
      status: this.mapXenditStatus(body.data?.status),
    };
  }

  async getStatus(providerRefId: string): Promise<StatusBayar> {
    if (!this.secretKey) {
      throw new Error('XENDIT_SECRET_KEY belum di-set.');
    }

    const response = await fetch(`https://api.xendit.co/qr_codes/${providerRefId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Xendit getStatus gagal (${response.status}) untuk ${providerRefId}.`);
    }

    const data = (await response.json()) as { status?: string };
    return this.mapXenditStatus(data.status);
  }

  private mapXenditStatus(status: string | undefined): StatusBayar {
    switch (status) {
      case 'PAID':
      case 'SUCCEEDED':
        return StatusBayar.PAID;
      case 'EXPIRED':
        return StatusBayar.EXPIRED;
      case 'FAILED':
        return StatusBayar.FAILED;
      default:
        return StatusBayar.PENDING;
    }
  }
}
