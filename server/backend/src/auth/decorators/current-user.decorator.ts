import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types';

/**
 * Ambil user yang sudah diresolusi SupabaseAuthGuard, mis.
 * `@CurrentUser() user: AuthenticatedUser` di parameter controller.
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.user) {
      throw new Error(
        '@CurrentUser dipakai di route tanpa SupabaseAuthGuard — request.user kosong.',
      );
    }
    return request.user;
  },
);
