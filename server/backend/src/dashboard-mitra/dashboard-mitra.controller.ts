import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { MitraOnlyGuard } from '../auth/guards/mitra-only.guard';
import { CurrentMitra } from '../auth/decorators/current-mitra.decorator';
import type { AuthenticatedMitraUser } from '../auth/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { DashboardMitraService } from './dashboard-mitra.service';
import { mitraLaporanFilterSchema, type MitraLaporanFilterDto } from './dto/mitra-laporan-filter.dto';
import { MemberService } from '../member/member.service';
import {
  createMemberMitraSchema,
  updateMemberMitraSchema,
  type CreateMemberMitraDto,
  type UpdateMemberMitraDto,
} from '../member/dto/member.dto';

/**
 * docs/API-Contract-Smartbox.md §6; docs/PRD-Smartbox.md §5.5. Dulu SENGAJA
 * hanya `GET`/`POST /laporan/export` — TIDAK ADA endpoint tulis (SMB-704).
 * Itu kebijakan sekarang DIREVISI SADAR: mitra kini boleh kelola member
 * "umum" (RFID/kode unik dengan diskon tarif) untuk lokasi miliknya sendiri
 * — permintaan bisnis langsung, lihat catatan model `Member` di
 * schema.prisma. Endpoint `members/*` di bawah ini SATU-SATUNYA endpoint
 * tulis mitra yang ada, dan sengaja terbatas (tidak pernah bisa mengikat
 * loker spesifik — itu tetap hak Super Admin, lihat member.controller.ts).
 */
@Controller('mitra')
@UseGuards(SupabaseAuthGuard, MitraOnlyGuard)
export class DashboardMitraController {
  constructor(
    private readonly dashboardMitraService: DashboardMitraService,
    private readonly memberService: MemberService,
  ) {}

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

  @Get('members')
  listMembers(
    @CurrentMitra() actor: AuthenticatedMitraUser,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '25',
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.memberService.listForMitra(actor, pageNum, pageSizeNum);
  }

  @Post('members')
  @UsePipes(new ZodValidationPipe(createMemberMitraSchema))
  createMember(@CurrentMitra() actor: AuthenticatedMitraUser, @Body() dto: CreateMemberMitraDto) {
    return this.memberService.createForMitra(actor, dto);
  }

  @Patch('members/:id')
  @UsePipes(new ZodValidationPipe(updateMemberMitraSchema))
  updateMember(
    @CurrentMitra() actor: AuthenticatedMitraUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberMitraDto,
  ) {
    return this.memberService.updateForMitra(actor, id, dto);
  }

  @Delete('members/:id')
  removeMember(@CurrentMitra() actor: AuthenticatedMitraUser, @Param('id') id: string) {
    return this.memberService.removeForMitra(actor, id);
  }
}
