import { Body, Controller, ForbiddenException, Param, Post, UseGuards } from '@nestjs/common';
import type { Unit } from '@prisma/client';
import { UnitKeyGuard } from '../kiosk/guards/unit-key.guard';
import { CurrentUnit } from '../kiosk/decorators/current-unit.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { GatewayService } from './gateway.service';
import { statusLokerSchema, type StatusLokerDto } from './dto/status-loker.dto';

/**
 * Fallback HTTP gateway hardware (docs/API-Contract-Smartbox.md §4.2) —
 * jalur cadangan saat broker MQTT down, BUKAN jalur utama (§4.1,
 * MqttClientService). Auth `X-Unit-Key` sama seperti Kiosk API (§1.2) —
 * kredensial per-unit yang sama, bukan Bearer Supabase.
 */
@Controller('gateway')
@UseGuards(UnitKeyGuard)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post(':kodeUnit/heartbeat')
  heartbeat(@Param('kodeUnit') kodeUnit: string, @CurrentUnit() unit: Unit) {
    this.pastikanUnitCocok(kodeUnit, unit);
    this.gatewayService.recordHeartbeat(kodeUnit);
    return { diterima: true };
  }

  @Post(':kodeUnit/status-loker')
  async statusLoker(
    @Param('kodeUnit') kodeUnit: string,
    @CurrentUnit() unit: Unit,
    @Body(new ZodValidationPipe(statusLokerSchema)) dto: StatusLokerDto,
  ) {
    this.pastikanUnitCocok(kodeUnit, unit);
    await this.gatewayService.syncStatusLoker(kodeUnit, dto.nomorLoker, dto.status);
    return { diterima: true };
  }

  /** X-Unit-Key hanya boleh melapor untuk kodeUnit miliknya sendiri — cegah satu unit spoof status unit lain lewat path param. */
  private pastikanUnitCocok(kodeUnitPath: string, unit: Unit) {
    if (unit.kodeUnit !== kodeUnitPath) {
      throw new ForbiddenException({
        error: { code: 'UNIT_TIDAK_COCOK', message: 'X-Unit-Key tidak cocok dengan kodeUnit di path.' },
      });
    }
  }
}
