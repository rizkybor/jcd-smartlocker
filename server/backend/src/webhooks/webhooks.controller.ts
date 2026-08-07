import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { XenditProvider } from '../payment/providers/xendit.provider';
import { MidtransProvider } from '../payment/providers/midtrans.provider';
import { WebhooksService } from './webhooks.service';
import type { PaymentProvider } from '../payment/payment-provider.interface';

/**
 * docs/API-Contract-Smartbox.md §3. TIDAK dijaga SupabaseAuthGuard — auth
 * webhook adalah verifikasi signature/token per provider (di dalam
 * `verifyWebhook()`), bukan Bearer token Supabase.
 *
 * Signature/token tidak valid -> 401 (§3, "gagal -> 401, log, stop").
 * Selain itu selalu balas 200 kalau payload sudah diverifikasi & diproses
 * (termasuk kasus idempotent-duplicate atau sesi tidak ditemukan) —
 * response non-200 di luar kasus auth memicu retry provider yang tidak
 * perlu.
 */
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly xendit: XenditProvider,
    private readonly midtrans: MidtransProvider,
  ) {}

  @Post('xendit')
  @HttpCode(200)
  handleXendit(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.dispatch(this.xendit, headers, body);
  }

  @Post('midtrans')
  @HttpCode(200)
  handleMidtrans(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.dispatch(this.midtrans, headers, body);
  }

  private async dispatch(
    provider: PaymentProvider,
    headers: Record<string, string | string[] | undefined>,
    body: Record<string, unknown>,
  ) {
    const result = await this.webhooksService.processWebhook(provider, { headers, body });

    if (result.outcome === 'invalid') {
      throw new UnauthorizedException({
        error: { code: 'WEBHOOK_SIGNATURE_INVALID', message: result.reason },
      });
    }

    return { data: result };
  }
}
