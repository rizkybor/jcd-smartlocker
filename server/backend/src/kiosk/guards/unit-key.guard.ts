import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { Unit } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

declare module 'express' {
  interface Request {
    unit?: Unit;
  }
}

/**
 * Autentikasi Kiosk API — header `X-Unit-Key` (docs/API-Contract-Smartbox.md
 * §1.2, §2), BUKAN Bearer token Supabase (itu untuk Dashboard Company/
 * Mitra, lihat SupabaseAuthGuard). Kiosk/gateway hardware punya kredensial
 * sendiri per-unit karena tidak ada manusia yang login di kiosk (§1,
 * prinsip "tanpa aplikasi").
 */
@Injectable()
export class UnitKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const unitKey = request.headers['x-unit-key'];

    if (!unitKey || Array.isArray(unitKey)) {
      throw new UnauthorizedException({
        error: { code: 'UNIT_KEY_TIDAK_ADA', message: 'Header X-Unit-Key wajib diisi.' },
      });
    }

    const unit = await this.prisma.db.unit.findFirst({
      where: { unitKey, aktif: true },
    });

    if (!unit) {
      throw new UnauthorizedException({
        error: { code: 'UNIT_KEY_TIDAK_VALID', message: 'X-Unit-Key tidak valid atau unit nonaktif.' },
      });
    }

    request.unit = unit;
    return true;
  }
}
