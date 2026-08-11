import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedInternalUser } from '../auth/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UnitService } from './unit.service';
import { createUnitSchema, type CreateUnitDto } from './dto/create-unit.dto';
import { updateUnitSchema, deleteUnitSchema, type UpdateUnitDto, type DeleteUnitDto } from './dto/update-unit.dto';
import { bukaPaksaSchema, type BukaPaksaDto } from './dto/buka-paksa.dto';

/**
 * docs/API-Contract-Smartbox.md §5.1 — dibuat minimal sebagai prasyarat
 * Kiosk API (Epic 3), lihat catatan di dto/create-unit.dto.ts. Endpoint
 * PATCH/DELETE/buka-paksa dibangun sebagai bagian Epic 6 (SMB-603/604).
 *
 * Pipe Zod per-parameter, bukan `@UsePipes()` method-level — lihat catatan
 * bug di kiosk/kiosk-sewa.controller.ts.
 */
@ApiTags('Company - Unit')
@ApiBearerAuth('supabase-auth')
@Controller('company/units')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Get()
  @Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS)
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '25') {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.unitService.list(pageNum, pageSizeNum);
  }

  @Get(':id')
  @Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS)
  findOne(@Param('id') id: string) {
    return this.unitService.findOneOrThrow(id);
  }

  @Post()
  @Roles(AkunInternalRole.SUPER_ADMIN)
  create(@Body(new ZodValidationPipe(createUnitSchema)) dto: CreateUnitDto) {
    return this.unitService.create(dto);
  }

  @Patch(':id')
  @Roles(AkunInternalRole.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUnitSchema)) dto: UpdateUnitDto,
    @CurrentUser() actor: AuthenticatedInternalUser,
  ) {
    return this.unitService.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles(AkunInternalRole.SUPER_ADMIN)
  remove(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(deleteUnitSchema)) dto: DeleteUnitDto,
    @CurrentUser() actor: AuthenticatedInternalUser,
  ) {
    return this.unitService.softDelete(id, dto.alasan, actor);
  }

  @Post(':id/buka-paksa')
  @Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS)
  bukaPaksa(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(bukaPaksaSchema)) dto: BukaPaksaDto,
    @CurrentUser() actor: AuthenticatedInternalUser,
  ) {
    return this.unitService.bukaPaksa(id, dto, actor);
  }

  /** Fitur overdue/denda/suspend (di luar cakupan PRD awal) — SENGAJA cuma SUPER_ADMIN, lihat catatan di unit.service.ts::bukaLokerSuspended(). */
  @Post(':id/buka-suspend')
  @Roles(AkunInternalRole.SUPER_ADMIN)
  bukaLokerSuspended(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(bukaPaksaSchema)) dto: BukaPaksaDto,
    @CurrentUser() actor: AuthenticatedInternalUser,
  ) {
    return this.unitService.bukaLokerSuspended(id, dto, actor);
  }
}
