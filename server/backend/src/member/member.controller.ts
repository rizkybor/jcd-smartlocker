import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedInternalUser } from '../auth/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MemberService } from './member.service';
import {
  createMemberSuperAdminSchema,
  updateMemberSuperAdminSchema,
  type CreateMemberSuperAdminDto,
  type UpdateMemberSuperAdminDto,
} from './dto/member.dto';

/**
 * Member RFID/kode unik — kelola penuh (termasuk ikat loker eksklusif)
 * hanya lewat Super Admin, lihat catatan model `Member` di schema.prisma.
 * Jalur mitra (member umum/diskon saja) ada di dashboard-mitra.controller.ts.
 */
@Controller('company/members')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(AkunInternalRole.SUPER_ADMIN)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
    @Query('mitraId') mitraId?: string,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.memberService.listForSuperAdmin(pageNum, pageSizeNum, mitraId);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createMemberSuperAdminSchema))
  create(@Body() dto: CreateMemberSuperAdminDto, @CurrentUser() actor: AuthenticatedInternalUser) {
    return this.memberService.createForSuperAdmin(dto, actor);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateMemberSuperAdminSchema))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberSuperAdminDto,
    @CurrentUser() actor: AuthenticatedInternalUser,
  ) {
    return this.memberService.updateForSuperAdmin(id, dto, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedInternalUser) {
    return this.memberService.removeForSuperAdmin(id, actor);
  }
}
