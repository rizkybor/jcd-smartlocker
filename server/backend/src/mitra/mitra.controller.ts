import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MitraService } from './mitra.service';
import { createMitraSchema, type CreateMitraDto } from './dto/create-mitra.dto';

/**
 * docs/API-Contract-Smartbox.md §5.2 (Partner). List boleh Ops/Manager
 * lihat, tapi create/delete tetap Super Admin saja (§5.4).
 */
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

  @Post()
  @Roles(AkunInternalRole.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(createMitraSchema))
  create(@Body() dto: CreateMitraDto) {
    return this.mitraService.create(dto);
  }

  @Delete(':id')
  @Roles(AkunInternalRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.mitraService.softDelete(id);
  }
}
