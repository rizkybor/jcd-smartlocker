import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { LokasiService } from './lokasi.service';
import { createLokasiSchema, type CreateLokasiDto } from './dto/create-lokasi.dto';
import { updateLokasiSchema, type UpdateLokasiDto } from './dto/update-lokasi.dto';

/**
 * Prasyarat untuk Unit/Mitra (§5.4) — belum jadi ticket Epic tersendiri di
 * docs/Epics-Smartbox.md, dibuat minimal di sini karena MitraLokasi (SMB-108)
 * butuh lokasiId yang valid untuk ditest end-to-end.
 */
@ApiTags('Company - Lokasi')
@ApiBearerAuth('supabase-auth')
@Controller('company/lokasi')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(AkunInternalRole.SUPER_ADMIN)
export class LokasiController {
  constructor(private readonly lokasiService: LokasiService) {}

  @Get()
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '25') {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.lokasiService.list(pageNum, pageSizeNum);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createLokasiSchema))
  create(@Body() dto: CreateLokasiDto) {
    return this.lokasiService.create(dto);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateLokasiSchema))
  update(@Param('id') id: string, @Body() dto: UpdateLokasiDto) {
    return this.lokasiService.update(id, dto);
  }
}
