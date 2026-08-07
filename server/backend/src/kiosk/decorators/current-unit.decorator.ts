import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Unit } from '@prisma/client';

/** Ambil Unit yang sudah diresolusi UnitKeyGuard, mis. `@CurrentUnit() unit: Unit`. */
export const CurrentUnit = createParamDecorator((_: unknown, ctx: ExecutionContext): Unit => {
  const request = ctx.switchToHttp().getRequest<Request>();
  if (!request.unit) {
    throw new Error('@CurrentUnit dipakai di route tanpa UnitKeyGuard — request.unit kosong.');
  }
  return request.unit;
});
