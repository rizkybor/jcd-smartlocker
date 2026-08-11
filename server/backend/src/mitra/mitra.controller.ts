import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MitraService } from './mitra.service';
import { createMitraSchema, type CreateMitraDto } from './dto/create-mitra.dto';
import { updateMitraSchema, type UpdateMitraDto } from './dto/update-mitra.dto';

/**
 * docs/API-Contract-Smartbox.md §5.2 (Partner). List boleh Ops/Manager
 * lihat, tapi create/update/delete tetap Super Admin saja (§5.4).
 *
 * Pipe Zod per-parameter, bukan `@UsePipes()` method-level — lihat catatan
 * bug di kiosk/kiosk-sewa.controller.ts.
 */
@ApiTags('Company - Mitra')
@ApiBearerAuth('supabase-auth')
@Controller('company/mitra')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class MitraController {
  constructor(private readonly mitraService: MitraService) {}

  @Get()
  @Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS, AkunInternalRole.MANAGER)
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '25') {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.mitraService.list(pageNum, pageSizeNum);
  }

  @Get(':id')
  @Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS, AkunInternalRole.MANAGER)
  findOne(@Param('id') id: string) {
    return this.mitraService.findOneOrThrow(id);
  }

  @Post()
  @Roles(AkunInternalRole.SUPER_ADMIN)
  create(@Body(new ZodValidationPipe(createMitraSchema)) dto: CreateMitraDto) {
    return this.mitraService.create(dto);
  }

  @Patch(':id')
  @Roles(AkunInternalRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateMitraSchema)) dto: UpdateMitraDto) {
    return this.mitraService.update(id, dto);
  }

  @Delete(':id')
  @Roles(AkunInternalRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.mitraService.softDelete(id);
  }
}
