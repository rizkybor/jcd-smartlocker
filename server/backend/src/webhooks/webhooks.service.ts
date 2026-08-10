import { Injectable, Logger } from '@nestjs/common';
import { StatusBayar, PaymentProviderType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PaymentProvider, VerifyWebhookInput } from '../payment/payment-provider.interface';

const TERMINAL_STATUSES: StatusBayar[] = [StatusBayar.PAID, StatusBayar.FAILED, StatusBayar.EXPIRED];

export type ProcessWebhookResult =
  | { outcome: 'invalid'; reason: string }
  | { outcome: 'sesi_tidak_ditemukan'; providerRefId: string }
  | { outcome: 'idempotent_diabaikan'; providerRefId: string; statusBayar: StatusBayar }
  | { outcome: 'diproses'; providerRefId: string; statusBayar: StatusBayar };

type PembayaranDitemukan = { jenis: 'sewa'; id: string; statusBayar: StatusBayar } | { jenis: 'denda'; id: string; statusBayar: StatusBayar };

/**
 * docs/API-Contract-Smartbox.md §3 — alur verify -> idempotency check ->
 * update -> (realtime publish otomatis lewat Supabase Realtime, §9.2,
 * karena kita update tabel yang di-subscribe, bukan langkah manual di sini).
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processWebhook(
    provider: PaymentProvider,
    input: VerifyWebhookInput,
  ): Promise<ProcessWebhookResult> {
    const verification = await provider.verifyWebhook(input);

    if (!verification.valid) {
      this.logger.warn(`Webhook ${provider.name} ditolak: ${verification.reason}`);
      return { outcome: 'invalid', reason: verification.reason };
    }

    const { providerRefId, status } = verification;

    const pembayaran = await this.cariPembayaran(provider.name, providerRefId);

    if (!pembayaran) {
      this.logger.warn(
        `Webhook ${provider.name} valid tapi charge (sewa/denda) untuk providerRefId=${providerRefId} tidak ditemukan.`,
      );
      return { outcome: 'sesi_tidak_ditemukan', providerRefId };
    }

    // Idempotency (§8, §9.3): kalau status sudah di kondisi terminal yang
    // sama, jangan proses ulang (retry webhook provider tidak boleh
    // menyebabkan efek samping dobel).
    if (TERMINAL_STATUSES.includes(pembayaran.statusBayar) && pembayaran.statusBayar === status) {
      return { outcome: 'idempotent_diabaikan', providerRefId, statusBayar: pembayaran.statusBayar };
    }

    if (pembayaran.jenis === 'sewa') {
      await this.prisma.db.sesiTransaksi.update({ where: { id: pembayaran.id }, data: { statusBayar: status } });
    } else {
      await this.prisma.db.sesiDenda.update({ where: { id: pembayaran.id }, data: { statusBayar: status } });
    }

    this.logger.log(
      `${pembayaran.jenis === 'sewa' ? 'SesiTransaksi' : 'SesiDenda'} ${pembayaran.id} (${provider.name}/${providerRefId}) -> ${status}`,
    );

    return { outcome: 'diproses', providerRefId, statusBayar: status };
  }

  /** Charge sewa (SesiTransaksi) DICEK LEBIH DULU, baru charge denda (SesiDenda) — ref-id unik per tabel, tidak pernah tabrakan lintas tabel. */
  private async cariPembayaran(
    provider: PaymentProviderType,
    providerRefId: string,
  ): Promise<PembayaranDitemukan | null> {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({
      where: { paymentProvider_paymentProviderRefId: { paymentProvider: provider, paymentProviderRefId: providerRefId } },
      select: { id: true, statusBayar: true },
    });
    if (sesi) return { jenis: 'sewa', id: sesi.id, statusBayar: sesi.statusBayar };

    const denda = await this.prisma.db.sesiDenda.findUnique({
      where: { paymentProvider_paymentProviderRefId: { paymentProvider: provider, paymentProviderRefId: providerRefId } },
      select: { id: true, statusBayar: true },
    });
    if (denda) return { jenis: 'denda', id: denda.id, statusBayar: denda.statusBayar };

    return null;
  }
}

export { PaymentProviderType };
