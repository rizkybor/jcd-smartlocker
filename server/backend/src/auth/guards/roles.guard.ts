import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AkunInternalRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Menegakkan `@Roles(...)` (§7). Wajib jalan SETELAH SupabaseAuthGuard —
 * kalau `request.user` belum diisi (mis. urutan guard salah), request
 * ditolak, bukan diloloskan diam-diam.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AkunInternalRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        error: {
          code: 'GUARD_TIDAK_TERPASANG_BENAR',
          message: 'RolesGuard dipanggil tanpa request.user — pastikan SupabaseAuthGuard dipasang sebelum RolesGuard.',
        },
      });
    }

    if (user.kind !== 'internal' || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        error: {
          code: 'ROLE_TIDAK_DIIZINKAN',
          message: `Role Anda tidak punya akses ke aksi ini. Dibutuhkan salah satu dari: ${requiredRoles.join(', ')}.`,
        },
      });
    }

    return true;
  }
}
