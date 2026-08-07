import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { StatusBayar } from '@prisma/client';
import { MidtransProvider } from './midtrans.provider';

describe('MidtransProvider.verifyWebhook', () => {
  const serverKey = 'test-server-key';
  let provider: MidtransProvider;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MidtransProvider,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => (key === 'MIDTRANS_SERVER_KEY' ? serverKey : undefined) },
        },
      ],
    }).compile();

    provider = moduleRef.get(MidtransProvider);
  });

  function signaturePayload(orderId: string, statusCode: string, grossAmount: string) {
    return createHash('sha512').update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest('hex');
  }

  it('menerima payload dengan signature_key yang benar', async () => {
    const body = {
      order_id: 'SB-TEST-001',
      status_code: '200',
      gross_amount: '15000.00',
      transaction_id: 'midtrans-txn-1',
      transaction_status: 'settlement',
    };
    const signature_key = signaturePayload(body.order_id, body.status_code, body.gross_amount);

    const result = await provider.verifyWebhook({ headers: {}, body: { ...body, signature_key } });

    expect(result).toEqual({
      valid: true,
      providerRefId: 'midtrans-txn-1',
      status: StatusBayar.PAID,
    });
  });

  it('menolak payload dengan signature_key yang salah', async () => {
    const body = {
      order_id: 'SB-TEST-001',
      status_code: '200',
      gross_amount: '15000.00',
      transaction_id: 'midtrans-txn-1',
      transaction_status: 'settlement',
      signature_key: 'signature-palsu',
    };

    const result = await provider.verifyWebhook({ headers: {}, body });

    expect(result.valid).toBe(false);
  });

  it('menolak payload yang tidak lengkap', async () => {
    const result = await provider.verifyWebhook({ headers: {}, body: { order_id: 'SB-TEST-001' } });
    expect(result.valid).toBe(false);
  });

  it.each([
    ['expire', undefined, StatusBayar.EXPIRED],
    ['deny', undefined, StatusBayar.FAILED],
    ['cancel', undefined, StatusBayar.FAILED],
    ['pending', undefined, StatusBayar.PENDING],
    ['capture', 'challenge', StatusBayar.PENDING],
    ['capture', 'accept', StatusBayar.PAID],
  ])('memetakan transaction_status=%s fraud_status=%s -> %s', async (transaction_status, fraud_status, expected) => {
    const body = {
      order_id: 'SB-TEST-002',
      status_code: '200',
      gross_amount: '10000.00',
      transaction_id: 'midtrans-txn-2',
      transaction_status,
      fraud_status,
    };
    const signature_key = signaturePayload(body.order_id, body.status_code, body.gross_amount);

    const result = await provider.verifyWebhook({ headers: {}, body: { ...body, signature_key } });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.status).toBe(expected);
    }
  });
});
