import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AkunInternalRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { MitraOnlyGuard } from './mitra-only.guard';

/**
 * SMB-1102 — RBAC per role (§5.4, §7): setiap role internal & akun mitra
 * harus diverifikasi menolak/meloloskan endpoint sesuai `@Roles(...)`, dan
 * akun mitra harus SELALU ditolak endpoint ber-`@Roles()` (dashboard mitra
 * tidak pernah punya endpoint tulis, §5.5).
 */
describe('RolesGuard', () => {
  function buildContext(user: unknown, requiredRoles: AkunInternalRole[] | undefined) {
    const request = { user };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as unknown as Reflector;
    return { context, reflector };
  }

  it('meloloskan semua request kalau handler tidak dipasangi @Roles()', () => {
    const { context, reflector } = buildContext({ kind: 'internal', role: AkunInternalRole.STAFF }, undefined);
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('menolak kalau request.user belum diisi (urutan guard salah)', () => {
    const { context, reflector } = buildContext(undefined, [AkunInternalRole.SUPER_ADMIN]);
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('menolak akun mitra pada endpoint ber-@Roles() (dashboard mitra tidak punya endpoint tulis)', () => {
    const { context, reflector } = buildContext({ kind: 'mitra', mitraId: 'm-1' }, [AkunInternalRole.SUPER_ADMIN]);
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it.each([
    [AkunInternalRole.SUPER_ADMIN, [AkunInternalRole.SUPER_ADMIN], true],
    [AkunInternalRole.STAFF, [AkunInternalRole.SUPER_ADMIN], false],
    [AkunInternalRole.OPS, [AkunInternalRole.OPS, AkunInternalRole.SUPER_ADMIN], true],
    [AkunInternalRole.MANAGER, [AkunInternalRole.OPS, AkunInternalRole.SUPER_ADMIN], false],
    [AkunInternalRole.MANAGER, [AkunInternalRole.MANAGER], true],
  ])('role %s dengan required %j -> diizinkan=%s', (role, requiredRoles, allowed) => {
    const { context, reflector } = buildContext({ kind: 'internal', role }, requiredRoles);
    const guard = new RolesGuard(reflector);

    if (allowed) {
      expect(guard.canActivate(context)).toBe(true);
    } else {
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    }
  });
});

describe('MitraOnlyGuard', () => {
  function buildContext(user: unknown) {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
    return context;
  }

  it('meloloskan akun mitra', () => {
    const guard = new MitraOnlyGuard();
    expect(guard.canActivate(buildContext({ kind: 'mitra', mitraId: 'm-1' }))).toBe(true);
  });

  it('menolak akun internal (termasuk Super Admin) pada endpoint /mitra/*', () => {
    const guard = new MitraOnlyGuard();
    expect(() =>
      guard.canActivate(buildContext({ kind: 'internal', role: AkunInternalRole.SUPER_ADMIN })),
    ).toThrow(ForbiddenException);
  });

  it('menolak request tanpa user sama sekali', () => {
    const guard = new MitraOnlyGuard();
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);
  });
});
