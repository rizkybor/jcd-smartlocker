import { Controller, Get, Post, Query, UseGuards, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { LaporanService } from './laporan.service';
import { laporanFilterSchema, exportLaporanSchema, type LaporanFilterDto, type ExportLaporanDto } from './dto/laporan-filter.dto';

/**
 * docs/API-Contract-Smartbox.md §5.3. Pipe Zod per-parameter — lihat
 * catatan bug di kiosk/kiosk-sewa.controller.ts.
 */
@ApiTags('Company - Laporan')
@ApiBearerAuth('supabase-auth')
@Controller('company/laporan')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS, AkunInternalRole.MANAGER)
export class LaporanController {
  constructor(private readonly laporanService: LaporanService) {}

  @Get('transaksi')
  transaksi(
    @Query(new ZodValidationPipe(laporanFilterSchema)) filter: LaporanFilterDto,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.laporanService.transaksi(filter, pageNum, pageSizeNum);
  }

  @Get('bagi-hasil')
  bagiHasil(@Query(new ZodValidationPipe(laporanFilterSchema)) filter: LaporanFilterDto) {
    return this.laporanService.bagiHasil(filter);
  }

  @Post('export')
  export(@Body(new ZodValidationPipe(exportLaporanSchema)) dto: ExportLaporanDto) {
    return this.laporanService.export(dto);
  }
}
