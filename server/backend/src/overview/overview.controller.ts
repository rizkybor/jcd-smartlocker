import { Controller, Get, UseGuards } from '@nestjs/common';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OverviewService } from './overview.service';

/** docs/API-Contract-Smartbox.md §5.1 (SMB-601). */
@Controller('company/overview')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS, AkunInternalRole.MANAGER)
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  ringkasan() {
    return this.overviewService.ringkasan();
  }
}
