import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { OTP_CHANNEL } from './otp-channel.interface';
import type { OtpChannel } from './otp-channel.interface';

const DEFAULT_EXPIRY_MINUTES = 5;

/**
 * Logic OTP channel-agnostic (§5.2, §6 — `SesiTransaksi.kodeOtpAmbilHash`
 * disimpan HASH, bukan plaintext). Dipakai kiosk alur "Ambil Barang" (Epic
 * 4, belum dibangun) lewat `OTP_CHANNEL` yang aktif saat ini (email/Brevo,
 * lihat otp.module.ts).
 */
@Injectable()
export class OtpService {
  constructor(@Inject(OTP_CHANNEL) private readonly channel: OtpChannel) {}

  /** Kode 6 digit, termasuk leading zero (mis. "004821"). */
  generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  /** Timing-safe compare — cegah timing attack terhadap hash OTP (§7.1). */
  verifyCode(code: string, hash: string): boolean {
    const candidate = Buffer.from(this.hashCode(code));
    const expected = Buffer.from(hash);
    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(candidate, expected);
  }

  async sendCode(
    destination: string,
    code: string,
    expiryMinutes = DEFAULT_EXPIRY_MINUTES,
  ): Promise<void> {
    await this.channel.send({ destination, code, expiryMinutes });
  }
}
