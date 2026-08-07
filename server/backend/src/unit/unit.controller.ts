import { Body, Controller, Get, Param, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UnitService } from './unit.service';
import { createUnitSchema, type CreateUnitDto } from './dto/create-unit.dto';

/**
 * docs/API-Contract-Smartbox.md §5.1 — dibuat minimal sebagai prasyarat
 * Kiosk API (Epic 3), lihat catatan di dto/create-unit.dto.ts.
 */
@Controller('company/units')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(AkunInternalRole.SUPER_ADMIN)
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Get()
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '25') {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.unitService.list(pageNum, pageSizeNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitService.findOneOrThrow(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createUnitSchema))
  create(@Body() dto: CreateUnitDto) {
    return this.unitService.create(dto);
  }
}
