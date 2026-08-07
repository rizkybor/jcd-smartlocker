import { Test } from '@nestjs/testing';
import { OTP_CHANNEL } from './otp-channel.interface';
import type { OtpChannel, SendOtpInput } from './otp-channel.interface';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;
  let sentInputs: SendOtpInput[];

  beforeEach(async () => {
    sentInputs = [];
    const fakeChannel: OtpChannel = {
      name: 'fake',
      send: async (input) => {
        sentInputs.push(input);
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [OtpService, { provide: OTP_CHANNEL, useValue: fakeChannel }],
    }).compile();

    service = moduleRef.get(OtpService);
  });

  it('generateCode menghasilkan 6 digit dengan leading zero', () => {
    for (let i = 0; i < 50; i++) {
      const code = service.generateCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('verifyCode menerima kode yang benar', () => {
    const code = '048213';
    const hash = service.hashCode(code);
    expect(service.verifyCode(code, hash)).toBe(true);
  });

  it('verifyCode menolak kode yang salah', () => {
    const hash = service.hashCode('048213');
    expect(service.verifyCode('000000', hash)).toBe(false);
  });

  it('verifyCode menolak hash dengan panjang berbeda tanpa error', () => {
    expect(service.verifyCode('048213', 'hash-pendek')).toBe(false);
  });

  it('sendCode meneruskan ke channel yang di-inject', async () => {
    await service.sendCode('penyewa@example.com', '123456', 5);
    expect(sentInputs).toEqual([
      { destination: 'penyewa@example.com', code: '123456', expiryMinutes: 5 },
    ]);
  });
});
