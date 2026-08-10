import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedMitraUser } from '../types';

/**
 * Ambil AkunMitra yang sudah diresolusi SupabaseAuthGuard + divalidasi
 * MitraOnlyGuard — dipakai `@CurrentMitra() mitra: AuthenticatedMitraUser`
 * di controller `/mitra/*` (§5.5).
 */
export const CurrentMitra = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedMitraUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (request.user?.kind !== 'mitra') {
      throw new Error(
        '@CurrentMitra dipakai di route tanpa MitraOnlyGuard — request.user bukan akun mitra.',
      );
    }
    return request.user;
  },
);
