import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { Unit } from '@prisma/client';
import { UnitKeyGuard } from './guards/unit-key.guard';
import { CurrentUnit } from './decorators/current-unit.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { KioskRfidService } from './kiosk-rfid.service';
import { KioskAmbilService } from './kiosk-ambil.service';
import { rfidScanSchema, type RfidScanDto } from './dto/rfid-scan.dto';

/**
 * Fitur member RFID (di luar cakupan PRD awal) — lihat catatan
 * kiosk-rfid.service.ts. Publik-per-unit sama seperti controller kiosk
 * lain (UnitKeyGuard, bukan Supabase Auth).
 */
@Controller('kiosk/rfid')
@UseGuards(UnitKeyGuard)
export class KioskRfidController {
  constructor(
    private readonly kioskRfidService: KioskRfidService,
    private readonly kioskAmbilService: KioskAmbilService,
  ) {}

  @Post('scan')
  scan(@CurrentUnit() unit: Unit, @Body(new ZodValidationPipe(rfidScanSchema)) dto: RfidScanDto) {
    return this.kioskRfidService.scan(unit, dto);
  }

  /** Ambil barang member "umum" — pengganti OTP, tap ulang kartu = otorisasi. */
  @Post(':sesiId/buka-pintu')
  bukaPintu(@Param('sesiId') sesiId: string) {
    return this.kioskAmbilService.bukaPintuViaRfid(sesiId);
  }
}
