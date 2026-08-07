import { Injectable } from '@nestjs/common';
import type { OtpChannel, SendOtpInput } from '../otp-channel.interface';

/**
 * BELUM DIIMPLEMENTASIKAN — disiapkan strukturnya saja (§8, SMB-207).
 * `WHATSAPP_BSP_API_KEY`/`WHATSAPP_BSP_SENDER_NUMBER` belum tersedia
 * (Epic 0 SMB-006). Channel aktif untuk sekarang adalah email
 * (`EmailOtpChannel`, `OTP_CHANNEL_ACTIVE=email`).
 *
 * Begitu kredensial BSP tersedia: implementasikan `send()` memanggil
 * WhatsApp Business API resmi (§8), lalu ganti `OTP_CHANNEL_ACTIVE=whatsapp`
 * — tidak perlu ubah OtpService atau alur ambil-barang (§5.2), karena
 * keduanya sudah dirancang channel-agnostic.
 */
@Injectable()
export class WhatsAppOtpChannel implements OtpChannel {
  readonly name = 'whatsapp';

  async send(_input: SendOtpInput): Promise<void> {
    throw new Error(
      'WhatsApp OTP channel belum dikonfigurasi (WHATSAPP_BSP_API_KEY kosong, Epic 0 SMB-006). ' +
        'Set OTP_CHANNEL_ACTIVE=email untuk pakai channel email (Brevo) sementara.',
    );
  }
}
