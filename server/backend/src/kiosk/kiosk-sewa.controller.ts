import { Body, Controller, Get, Param, Post, UseGuards, UsePipes } from '@nestjs/common';
import type { Unit } from '@prisma/client';
import { UnitKeyGuard } from './guards/unit-key.guard';
import { CurrentUnit } from './decorators/current-unit.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { KioskSewaService } from './kiosk-sewa.service';
import { nomorHpSchema, type NomorHpDto } from './dto/nomor-hp.dto';
import { mulaiSewaSchema, type MulaiSewaDto } from './dto/mulai-sewa.dto';

/**
 * docs/API-Contract-Smartbox.md §2 — alur sewa (docs/PRD-Smartbox.md §5.1).
 * Semua endpoint di sini publik-per-unit (UnitKeyGuard, bukan Supabase
 * Auth) — kiosk tidak punya akun pengguna (§1).
 */
@Controller('kiosk')
@UseGuards(UnitKeyGuard)
export class KioskSewaController {
  constructor(private readonly kioskSewaService: KioskSewaService) {}

  @Get('unit/status')
  statusUnit(@CurrentUnit() unit: Unit) {
    return this.kioskSewaService.statusUnit(unit);
  }

  @Post('sewa/validasi-hp')
  @UsePipes(new ZodValidationPipe(nomorHpSchema))
  validasiHp(@Body() _dto: NomorHpDto) {
    // Pipe sudah menolak (400) kalau format salah — sampai sini berarti valid.
    return { valid: true };
  }

  @Post('sewa/mulai')
  @UsePipes(new ZodValidationPipe(mulaiSewaSchema))
  mulaiSewa(@CurrentUnit() unit: Unit, @Body() dto: MulaiSewaDto) {
    return this.kioskSewaService.mulaiSewa(unit, dto);
  }

  @Post('sewa/:sesiId/bayar')
  buatPembayaran(@Param('sesiId') sesiId: string) {
    return this.kioskSewaService.buatPembayaran(sesiId);
  }

  @Get('sewa/:sesiId/status')
  statusBayar(@Param('sesiId') sesiId: string) {
    return this.kioskSewaService.getStatusBayar(sesiId);
  }

  @Post('sewa/:sesiId/buka-pintu')
  bukaPintu(@Param('sesiId') sesiId: string) {
    return this.kioskSewaService.bukaPintu(sesiId);
  }

  @Get('sewa/:sesiId/struk')
  struk(@Param('sesiId') sesiId: string) {
    return this.kioskSewaService.getStruk(sesiId);
  }
}
