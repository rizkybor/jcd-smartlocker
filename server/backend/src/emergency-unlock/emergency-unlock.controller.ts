import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedInternalUser } from '../auth/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { EmergencyUnlockService } from './emergency-unlock.service';
import {
  createEmergencyUnlockSchema,
  type CreateEmergencyUnlockDto,
} from './dto/create-emergency-unlock.dto';

/**
 * docs/API-Contract-Smartbox.md §5.5.
 *
 * Pipe Zod per-parameter, bukan `@UsePipes()` method-level — lihat catatan
 * bug di kiosk/kiosk-sewa.controller.ts.
 */
@ApiTags('Company - Emergency Unlock')
@ApiBearerAuth('supabase-auth')
@Controller('company/emergency-unlock-log')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class EmergencyUnlockController {
  constructor(private readonly emergencyUnlockService: EmergencyUnlockService) {}

  @Get()
  @Roles(AkunInternalRole.SUPER_ADMIN, AkunInternalRole.OPS)
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '25') {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.emergencyUnlockService.list(pageNum, pageSizeNum);
  }

  @Post()
  @Roles(AkunInternalRole.STAFF, AkunInternalRole.SUPER_ADMIN)
  create(
    @Body(new ZodValidationPipe(createEmergencyUnlockSchema)) dto: CreateEmergencyUnlockDto,
    @CurrentUser() actor: AuthenticatedInternalUser,
  ) {
    return this.emergencyUnlockService.create(dto, actor);
  }
}
