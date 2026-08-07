import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OtpChannel, SendOtpInput } from '../otp-channel.interface';
import type { EnvConfig } from '../../config/env.validation';

/**
 * Channel OTP AKTIF saat ini — kirim via Brevo transactional email API
 * (https://api.brevo.com/v3/smtp/email), dipakai sementara sampai
 * WhatsApp Business API/BSP tersedia (§8, Epic 0 SMB-006).
 *
 * BELUM DITES terhadap API Brevo sungguhan — `BREVO_API_KEY` di .env masih
 * kosong. Struktur request mengikuti dokumentasi resmi Brevo Transactional
 * Email API v3 — verifikasi ulang sebelum live kalau ada perubahan API.
 */
@Injectable()
export class EmailOtpChannel implements OtpChannel {
  readonly name = 'email';
  private readonly logger = new Logger(EmailOtpChannel.name);
  private readonly apiKey: string | undefined;
  private readonly senderEmail: string | undefined;
  private readonly senderName: string;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.apiKey = config.get('BREVO_API_KEY', { infer: true });
    this.senderEmail = config.get('BREVO_SENDER_EMAIL', { infer: true });
    this.senderName = config.get('BREVO_SENDER_NAME', { infer: true }) ?? 'Smartbox';
  }

  async send(input: SendOtpInput): Promise<void> {
    if (!this.apiKey || !this.senderEmail) {
      throw new Error(
        'BREVO_API_KEY / BREVO_SENDER_EMAIL belum di-set — tidak bisa kirim OTP via email.',
      );
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email: input.destination }],
        subject: `Kode OTP Ambil Barang: ${input.code}`,
        htmlContent: `<p>Kode OTP Anda: <strong>${input.code}</strong></p><p>Berlaku ${input.expiryMinutes} menit. Jangan bagikan kode ini ke siapa pun.</p>`,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Brevo kirim OTP gagal (${response.status}): ${errorBody}`);
    }

    this.logger.log(`OTP terkirim ke ${input.destination} via email (Brevo).`);
  }
}
