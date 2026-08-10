import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Menegakkan bahwa route `/mitra/*` (docs/API-Contract-Smartbox.md §6)
 * HANYA bisa diakses `AkunMitra`, bukan `AkunInternal` — dua dashboard
 * beda kredensial (§5.4 vs §5.5), jangan izinkan Super Admin/dst. numpang
 * lewat token mereka sendiri ke API mitra (walau secara data mereka boleh
 * lihat semua, ini soal pemisahan jalur akses yang jelas & bisa diaudit).
 * Dipasang SETELAH SupabaseAuthGuard.
 */
@Injectable()
export class MitraOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.user?.kind !== 'mitra') {
      throw new ForbiddenException({
        error: {
          code: 'BUKAN_AKUN_MITRA',
          message: 'Endpoint ini khusus akun mitra.',
        },
      });
    }

    return true;
  }
}
