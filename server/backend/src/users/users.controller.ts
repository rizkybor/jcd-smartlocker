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
  UsePipes,
} from '@nestjs/common';
import { AkunInternalRole } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedInternalUser } from '../auth/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UsersService } from './users.service';
import { createUserSchema, type CreateUserDto } from './dto/create-user.dto';
import { updateUserRoleSchema, type UpdateUserRoleDto } from './dto/update-user-role.dto';

/**
 * Manajemen User — docs/PRD-Smartbox.md §5.4, §7; docs/API-Contract-Smartbox.md §5.4.
 * HANYA Super Admin — @Roles(SUPER_ADMIN) menolak semua role lain, termasuk
 * Manager, di level guard (bukan cuma disembunyikan di UI dashboard).
 */
@Controller('company/users')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(AkunInternalRole.SUPER_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '25') {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.usersService.list(pageNum, pageSizeNum);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createUserSchema))
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedInternalUser) {
    return this.usersService.create(dto, actor);
  }

  @Patch(':id/role')
  @UsePipes(new ZodValidationPipe(updateUserRoleSchema))
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: AuthenticatedInternalUser,
  ) {
    return this.usersService.updateRole(id, dto, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedInternalUser) {
    return this.usersService.softDelete(id, actor);
  }
}
