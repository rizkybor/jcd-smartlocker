import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PAYMENT_PROVIDER } from './payment-provider.interface';
import type { PaymentProvider } from './payment-provider.interface';
import type { EnvConfig } from '../config/env.validation';
import { XenditProvider } from './providers/xendit.provider';
import { MidtransProvider } from './providers/midtrans.provider';

/**
 * `PAYMENT_PROVIDER` = provider AKTIF untuk transaksi baru (dipilih dari
 * `PAYMENT_PROVIDER_ACTIVE`, §8) — dipakai kode pembuatan charge (Epic 3).
 *
 * `XenditProvider`/`MidtransProvider` TETAP di-export sebagai provider
 * biasa (bukan cuma lewat token) — WebhooksModule butuh KEDUANYA sekaligus
 * (bukan cuma yang aktif), karena transaksi lama yang dibuat sebelum
 * provider di-switch tetap perlu menerima webhook dari provider lamanya.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    XenditProvider,
    MidtransProvider,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, XenditProvider, MidtransProvider],
      useFactory: (
        config: ConfigService<EnvConfig, true>,
        xendit: XenditProvider,
        midtrans: MidtransProvider,
      ): PaymentProvider => {
        const active = config.get('PAYMENT_PROVIDER_ACTIVE', { infer: true });
        return active === 'midtrans' ? midtrans : xendit;
      },
    },
  ],
  exports: [PAYMENT_PROVIDER, XenditProvider, MidtransProvider],
})
export class PaymentModule {}
