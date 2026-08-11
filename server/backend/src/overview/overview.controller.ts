import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AkunInternalRole, LokerStatus } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OverviewService } from './overview.service';

/** docs/API-Contract-Smartbox.md §5.1 (SMB-601). */
@ApiTags('Company - Overview')
@ApiBearerAuth('supabase-auth')
@Controller('company/overview')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS, AkunInternalRole.MANAGER)
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  ringkasan() {
    return this.overviewService.ringkasan();
  }

  /** Fitur monitoring lanjutan (di luar cakupan PRD awal) — tren 14 hari, rollup per mitra, daftar semua loker. */
  @Get('tren')
  tren() {
    return this.overviewService.tren();
  }

  @Get('mitra')
  mitraRingkasan() {
    return this.overviewService.mitraRingkasan();
  }

  @Get('lokers')
  lokerList(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
    @Query('status') status?: LokerStatus,
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.overviewService.lokerList(pageNum, pageSizeNum, status, search);
  }
}
