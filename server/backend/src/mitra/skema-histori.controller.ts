import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedInternalUser } from '../auth/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SkemaHistoriService } from './skema-histori.service';
import { ajukanSkemaSchema, type AjukanSkemaDto } from './dto/ajukan-skema.dto';

/**
 * docs/API-Contract-Smartbox.md §5.2 — alur persentase revenue sharing.
 * Super Admin MENENTUKAN (bukan mitra mengajukan), Manager APPROVE — dua
 * role berbeda, ditegakkan lewat @Roles() terpisah per endpoint (§7, §10,
 * §12 poin 2).
 *
 * Pipe Zod per-parameter, bukan `@UsePipes()` method-level — lihat catatan
 * bug di kiosk/kiosk-sewa.controller.ts.
 */
@ApiTags('Company - Skema Histori')
@ApiBearerAuth('supabase-auth')
@Controller()
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class SkemaHistoriController {
  constructor(private readonly skemaHistoriService: SkemaHistoriService) {}

  @Get('company/mitra-lokasi/:id/skema-histori')
  @Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS, AkunInternalRole.MANAGER)
  listHistori(@Param('id') mitraLokasiId: string) {
    return this.skemaHistoriService.listHistori(mitraLokasiId);
  }

  @Post('company/mitra-lokasi/:id/ajukan-skema')
  @Roles(AkunInternalRole.SUPER_ADMIN)
  ajukan(
    @Param('id') mitraLokasiId: string,
    @Body(new ZodValidationPipe(ajukanSkemaSchema)) dto: AjukanSkemaDto,
    @CurrentUser() actor: AuthenticatedInternalUser,
  ) {
    return this.skemaHistoriService.ajukan(mitraLokasiId, dto, actor);
  }

  @Post('company/skema-histori/:id/approve')
  @Roles(AkunInternalRole.MANAGER)
  approve(@Param('id') historiId: string, @CurrentUser() actor: AuthenticatedInternalUser) {
    return this.skemaHistoriService.approve(historiId, actor);
  }

  @Post('company/skema-histori/:id/reject')
  @Roles(AkunInternalRole.MANAGER)
  reject(@Param('id') historiId: string, @CurrentUser() actor: AuthenticatedInternalUser) {
    return this.skemaHistoriService.reject(historiId, actor);
  }
}
