import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedInternalUser } from '../auth/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UnitService } from './unit.service';
import { lokerStatusSchema, type LokerStatusDto } from './dto/loker-status.dto';

/**
 * docs/API-Contract-Smartbox.md §5.1 — PATCH /company/lokers/:id/status.
 * Resource terpisah dari /company/units meski logic-nya di UnitService
 * (loker milik unit, tapi endpoint-nya sendiri sesuai kontrak).
 */
@Controller('company/lokers')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class LokerController {
  constructor(private readonly unitService: UnitService) {}

  @Patch(':id/status')
  @Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS)
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(lokerStatusSchema)) dto: LokerStatusDto,
    @CurrentUser() actor: AuthenticatedInternalUser,
  ) {
    return this.unitService.updateLokerStatus(id, dto, actor);
  }
}
