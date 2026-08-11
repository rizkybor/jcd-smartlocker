import { Controller, ForbiddenException, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';

/**
 * `GET /company/me` — profil akun yang sedang login (§5.4). Role TIDAK
 * ada di klaim JWT Supabase Auth, cuma bisa didapat lewat resolusi
 * `SupabaseAuthGuard` (lookup `AkunInternal`/`AkunMitra`) — endpoint ini
 * satu-satunya cara dashboard tahu "saya siapa & role apa" untuk gating
 * UI di sisi client (di luar penegakan sungguhan yang tetap di guard
 * backend tiap endpoint, §7).
 */
@ApiTags('Company - Profile')
@ApiBearerAuth('supabase-auth')
@Controller('company/me')
@UseGuards(SupabaseAuthGuard)
export class ProfileController {
  @Get()
  me(@CurrentUser() user: AuthenticatedUser) {
    if (user.kind !== 'internal') {
      throw new ForbiddenException({
        error: { code: 'BUKAN_AKUN_INTERNAL', message: 'Endpoint ini khusus akun internal Dashboard Company.' },
      });
    }
    return { id: user.id, email: user.email, nama: user.nama, role: user.role };
  }
}
