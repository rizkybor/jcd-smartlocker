import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AkunInternalRole, LogKategori } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AktivitasService } from './aktivitas.service';

/** docs/API-Contract-Smartbox.md §5.5. */
@Controller('company/aktivitas')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS, AkunInternalRole.MANAGER)
export class AktivitasController {
  constructor(private readonly aktivitasService: AktivitasService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
    @Query('kategori') kategoriRaw?: string,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    const kategori = Object.values(LogKategori).includes(kategoriRaw as LogKategori)
      ? (kategoriRaw as LogKategori)
      : undefined;
    return this.aktivitasService.list(pageNum, pageSizeNum, kategori);
  }
}
