import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StatusBayar } from '@prisma/client';
import { XenditProvider } from './xendit.provider';

describe('XenditProvider.verifyWebhook', () => {
  const webhookToken = 'test-webhook-token';
  let provider: XenditProvider;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        XenditProvider,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'XENDIT_WEBHOOK_TOKEN' ? webhookToken : undefined,
          },
        },
      ],
    }).compile();

    provider = moduleRef.get(XenditProvider);
  });

  it('menerima payload dengan x-callback-token yang benar', async () => {
    const result = await provider.verifyWebhook({
      headers: { 'x-callback-token': webhookToken },
      body: { event: 'qr.payment', data: { qr_id: 'xendit-qr-1', status: 'PAID' } },
    });

    expect(result).toEqual({
      valid: true,
      providerRefId: 'xendit-qr-1',
      status: StatusBayar.PAID,
    });
  });

  it('menolak payload dengan x-callback-token yang salah', async () => {
    const result = await provider.verifyWebhook({
      headers: { 'x-callback-token': 'token-palsu' },
      body: { data: { qr_id: 'xendit-qr-1', status: 'PAID' } },
    });

    expect(result.valid).toBe(false);
  });

  it('menolak payload tanpa qr_id/id', async () => {
    const result = await provider.verifyWebhook({
      headers: { 'x-callback-token': webhookToken },
      body: { data: { status: 'PAID' } },
    });

    expect(result.valid).toBe(false);
  });

  it.each([
    ['PAID', StatusBayar.PAID],
    ['SUCCEEDED', StatusBayar.PAID],
    ['EXPIRED', StatusBayar.EXPIRED],
    ['FAILED', StatusBayar.FAILED],
    ['ACTIVE', StatusBayar.PENDING],
  ])('memetakan status=%s -> %s', async (status, expected) => {
    const result = await provider.verifyWebhook({
      headers: { 'x-callback-token': webhookToken },
      body: { data: { qr_id: 'xendit-qr-2', status } },
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.status).toBe(expected);
    }
  });
});
