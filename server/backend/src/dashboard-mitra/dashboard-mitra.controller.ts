import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { MitraOnlyGuard } from '../auth/guards/mitra-only.guard';
import { CurrentMitra } from '../auth/decorators/current-mitra.decorator';
import type { AuthenticatedMitraUser } from '../auth/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { DashboardMitraService } from './dashboard-mitra.service';
import { mitraLaporanFilterSchema, type MitraLaporanFilterDto } from './dto/mitra-laporan-filter.dto';

/**
 * docs/API-Contract-Smartbox.md §6; docs/PRD-Smartbox.md §5.5. SENGAJA
 * HANYA `GET`/`POST /laporan/export` (read-side, generate file dari data
 * yang sudah ada) — TIDAK ADA satu pun endpoint tulis (SMB-704). Kalau
 * suatu saat ada kebutuhan mitra mengubah sesuatu, itu keputusan sadar
 * baru, bukan ditambahkan diam-diam di sini (lihat API Contract §6).
 */
@Controller('mitra')
@UseGuards(SupabaseAuthGuard, MitraOnlyGuard)
export class DashboardMitraController {
  constructor(private readonly dashboardMitraService: DashboardMitraService) {}

  @Get('me')
  me(@CurrentMitra() actor: AuthenticatedMitraUser) {
    return this.dashboardMitraService.me(actor);
  }

  @Get('overview')
  overview(@CurrentMitra() actor: AuthenticatedMitraUser) {
    return this.dashboardMitraService.overview(actor);
  }

  @Get('units')
  units(
    @CurrentMitra() actor: AuthenticatedMitraUser,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.dashboardMitraService.units(actor, pageNum, pageSizeNum);
  }

  @Get('laporan')
  laporan(
    @CurrentMitra() actor: AuthenticatedMitraUser,
    @Query(new ZodValidationPipe(mitraLaporanFilterSchema)) filter: MitraLaporanFilterDto,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.dashboardMitraService.laporan(actor, filter, pageNum, pageSizeNum);
  }

  @Post('laporan/export')
  export(
    @CurrentMitra() actor: AuthenticatedMitraUser,
    @Body(new ZodValidationPipe(mitraLaporanFilterSchema)) filter: MitraLaporanFilterDto,
  ) {
    return this.dashboardMitraService.export(actor, filter);
  }
}
