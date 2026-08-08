import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../types';

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

/**
 * Verifikasi `Authorization: Bearer <supabase-jwt>` (docs/API-Contract-Smartbox.md
 * §1.2) lalu petakan ke AkunInternal atau AkunMitra lewat `supabaseAuthUid`.
 * Menolak (401) kalau token tidak valid ATAU user tidak terdaftar di salah
 * satu tabel akun — token Supabase Auth yang valid tapi belum diprovision
 * Super Admin (§5.4, §7) bukan alasan untuk diberi akses.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        error: { code: 'AUTH_HEADER_TIDAK_ADA', message: 'Header Authorization tidak ada atau salah format.' },
      });
    }

    const token = authHeader.slice('Bearer '.length);
    const supabaseUser = await this.supabase.getUserFromToken(token);

    if (!supabaseUser) {
      throw new UnauthorizedException({
        error: { code: 'TOKEN_TIDAK_VALID', message: 'Token tidak valid atau sudah kedaluwarsa.' },
      });
    }

    const internal = await this.prisma.db.akunInternal.findFirst({
      where: { supabaseAuthUid: supabaseUser.id },
    });

    if (internal) {
      request.user = {
        kind: 'internal',
        id: internal.id,
        supabaseAuthUid: internal.supabaseAuthUid,
        email: internal.email,
        nama: internal.nama,
        role: internal.role,
      };
      return true;
    }

    const mitra = await this.prisma.db.akunMitra.findFirst({
      where: { supabaseAuthUid: supabaseUser.id },
    });

    if (mitra) {
      request.user = {
        kind: 'mitra',
        id: mitra.id,
        supabaseAuthUid: mitra.supabaseAuthUid,
        email: mitra.email,
        mitraId: mitra.mitraId,
      };
      return true;
    }

    throw new UnauthorizedException({
      error: {
        code: 'AKUN_TIDAK_TERDAFTAR',
        message: 'Akun terautentikasi di Supabase tapi belum terdaftar sebagai akun internal maupun akun mitra.',
      },
    });
  }
}
