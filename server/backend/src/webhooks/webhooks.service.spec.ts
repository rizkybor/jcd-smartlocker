import { StatusBayar } from '@prisma/client';
import { WebhooksService } from './webhooks.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { PaymentProvider } from '../payment/payment-provider.interface';

/**
 * SMB-1102 — orkestrasi webhook payment (docs/API-Contract-Smartbox.md §3):
 * verifikasi signature didelegasikan ke provider (sudah ditest terpisah di
 * xendit.provider.spec.ts/midtrans.provider.spec.ts) — di sini fokus ke
 * bagian yang jadi tanggung jawab WebhooksService sendiri: idempotency
 * (webhook retry TIDAK boleh punya efek samping dobel) dan penanganan sesi
 * yang tidak ditemukan.
 */
describe('WebhooksService.processWebhook', () => {
  function buildProvider(verification: unknown) {
    return {
      name: 'xendit',
      verifyWebhook: jest.fn().mockResolvedValue(verification),
    } as unknown as PaymentProvider;
  }

  function buildPrisma(sesi: Record<string, unknown> | null) {
    const update = jest.fn().mockResolvedValue({});
    const prisma = {
      db: {
        sesiTransaksi: { findUnique: jest.fn().mockResolvedValue(sesi), update },
      },
    } as unknown as PrismaService;
    return { prisma, update };
  }

  it('mengembalikan outcome invalid kalau signature webhook tidak valid, tanpa menyentuh DB', async () => {
    const provider = buildProvider({ valid: false, reason: 'Signature tidak cocok' });
    const { prisma, update } = buildPrisma(null);
    const service = new WebhooksService(prisma);

    const result = await service.processWebhook(provider, {} as never);

    expect(result).toEqual({ outcome: 'invalid', reason: 'Signature tidak cocok' });
    expect(update).not.toHaveBeenCalled();
  });

  it('mengembalikan outcome sesi_tidak_ditemukan kalau webhook valid tapi providerRefId tidak match sesi manapun', async () => {
    const provider = buildProvider({ valid: true, providerRefId: 'ref-1', status: StatusBayar.PAID });
    const { prisma, update } = buildPrisma(null);
    const service = new WebhooksService(prisma);

    const result = await service.processWebhook(provider, {} as never);

    expect(result).toEqual({ outcome: 'sesi_tidak_ditemukan', providerRefId: 'ref-1' });
    expect(update).not.toHaveBeenCalled();
  });

  it('idempotent — webhook retry dengan status terminal yang SAMA tidak memicu update DB lagi', async () => {
    const provider = buildProvider({ valid: true, providerRefId: 'ref-1', status: StatusBayar.PAID });
    const { prisma, update } = buildPrisma({ id: 'sesi-1', statusBayar: StatusBayar.PAID });
    const service = new WebhooksService(prisma);

    const result = await service.processWebhook(provider, {} as never);

    expect(result).toEqual({ outcome: 'idempotent_diabaikan', providerRefId: 'ref-1', statusBayar: StatusBayar.PAID });
    expect(update).not.toHaveBeenCalled();
  });

  it('memproses & update DB kalau status baru berbeda dari status tersimpan', async () => {
    const provider = buildProvider({ valid: true, providerRefId: 'ref-1', status: StatusBayar.PAID });
    const { prisma, update } = buildPrisma({ id: 'sesi-1', statusBayar: StatusBayar.PENDING });
    const service = new WebhooksService(prisma);

    const result = await service.processWebhook(provider, {} as never);

    expect(result).toEqual({ outcome: 'diproses', providerRefId: 'ref-1', statusBayar: StatusBayar.PAID });
    expect(update).toHaveBeenCalledWith({ where: { id: 'sesi-1' }, data: { statusBayar: StatusBayar.PAID } });
  });

  it('webhook FAILED yang datang setelah sesi PENDING tetap diproses (bukan status terminal yang sama)', async () => {
    const provider = buildProvider({ valid: true, providerRefId: 'ref-1', status: StatusBayar.FAILED });
    const { prisma, update } = buildPrisma({ id: 'sesi-1', statusBayar: StatusBayar.PENDING });
    const service = new WebhooksService(prisma);

    const result = await service.processWebhook(provider, {} as never);

    expect(result.outcome).toBe('diproses');
    expect(update).toHaveBeenCalledWith({ where: { id: 'sesi-1' }, data: { statusBayar: StatusBayar.FAILED } });
  });

  it('dua status terminal yang BERBEDA (mis. sesi sudah EXPIRED, webhook susulan bilang PAID) tetap diproses, bukan idempotent', async () => {
    const provider = buildProvider({ valid: true, providerRefId: 'ref-1', status: StatusBayar.PAID });
    const { prisma, update } = buildPrisma({ id: 'sesi-1', statusBayar: StatusBayar.EXPIRED });
    const service = new WebhooksService(prisma);

    const result = await service.processWebhook(provider, {} as never);

    expect(result.outcome).toBe('diproses');
    expect(update).toHaveBeenCalled();
  });
});
