import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Unit } from '@prisma/client';
import { UnitKeyGuard } from './guards/unit-key.guard';
import { CurrentUnit } from './decorators/current-unit.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { KioskAmbilService } from './kiosk-ambil.service';
import { ambilMulaiSchema, type AmbilMulaiDto } from './dto/ambil-mulai.dto';
import { sesiIdSchema, verifikasiOtpSchema, type SesiIdDto, type VerifikasiOtpDto } from './dto/verifikasi-otp.dto';

/**
 * docs/API-Contract-Smartbox.md §2 — alur ambil barang (docs/PRD-Smartbox.md
 * §5.2). Rate limit kirim/verifikasi OTP sesuai §1.6 — named throttler
 * `otp-send`/`otp-verify` sudah didaftarkan di app.module.ts.
 *
 * Pipe validasi Zod per-parameter (`@Body(new ZodValidationPipe(schema))`),
 * BUKAN `@UsePipes()` method-level — lihat catatan di kiosk-sewa.controller.ts.
 */
@Controller('kiosk/ambil')
@UseGuards(UnitKeyGuard)
export class KioskAmbilController {
  constructor(private readonly kioskAmbilService: KioskAmbilService) {}

  @Post('mulai')
  mulaiAmbil(
    @CurrentUnit() unit: Unit,
    @Body(new ZodValidationPipe(ambilMulaiSchema)) dto: AmbilMulaiDto,
  ) {
    return this.kioskAmbilService.mulaiAmbil(unit, dto);
  }

  @Post('kirim-otp')
  @Throttle({ 'otp-send': { limit: 3, ttl: 900_000 } })
  kirimOtp(@Body(new ZodValidationPipe(sesiIdSchema)) dto: SesiIdDto) {
    return this.kioskAmbilService.kirimOtp(dto.sesiId);
  }

  @Post('verifikasi-otp')
  @Throttle({ 'otp-verify': { limit: 5, ttl: 900_000 } })
  verifikasiOtp(@Body(new ZodValidationPipe(verifikasiOtpSchema)) dto: VerifikasiOtpDto) {
    return this.kioskAmbilService.verifikasiOtp(dto);
  }

  @Post(':sesiId/buka-pintu')
  bukaPintu(@Param('sesiId') sesiId: string) {
    return this.kioskAmbilService.bukaPintu(sesiId);
  }
}
