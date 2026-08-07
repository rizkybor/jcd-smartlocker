import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OTP_CHANNEL } from './otp-channel.interface';
import type { OtpChannel } from './otp-channel.interface';
import type { EnvConfig } from '../config/env.validation';
import { EmailOtpChannel } from './channels/email-otp.channel';
import { WhatsAppOtpChannel } from './channels/whatsapp-otp.channel';
import { OtpService } from './otp.service';

/**
 * `OTP_CHANNEL_ACTIVE` default `email` (Brevo) — lihat catatan di
 * otp-channel.interface.ts. Ganti ke `whatsapp` begitu
 * `WhatsAppOtpChannel.send()` sudah diimplementasikan & kredensial BSP
 * tersedia (Epic 0 SMB-006).
 */
@Module({
  imports: [ConfigModule],
  providers: [
    EmailOtpChannel,
    WhatsAppOtpChannel,
    OtpService,
    {
      provide: OTP_CHANNEL,
      inject: [ConfigService, EmailOtpChannel, WhatsAppOtpChannel],
      useFactory: (
        config: ConfigService<EnvConfig, true>,
        email: EmailOtpChannel,
        whatsapp: WhatsAppOtpChannel,
      ): OtpChannel => {
        const active = config.get('OTP_CHANNEL_ACTIVE', { infer: true });
        return active === 'whatsapp' ? whatsapp : email;
      },
    },
  ],
  exports: [OtpService],
})
export class OtpModule {}
