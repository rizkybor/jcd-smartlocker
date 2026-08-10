import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import type { SupabaseService } from '../../supabase/supabase.service';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * SMB-1102 — SupabaseAuthGuard adalah gerbang auth pertama untuk SEMUA
 * endpoint internal & mitra: token Supabase valid tapi belum ter-provision
 * di AkunInternal/AkunMitra WAJIB tetap ditolak 401 (§7, §7.1 "least
 * privilege") — bukan diam-diam diloloskan.
 */
describe('SupabaseAuthGuard', () => {
  function buildContext(headers: Record<string, string> = {}) {
    const request: { headers: Record<string, string>; user?: unknown } = { headers };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  function buildGuard(opts: {
    supabaseUser?: { id: string } | null;
    internal?: Record<string, unknown> | null;
    mitra?: Record<string, unknown> | null;
  }) {
    const supabase = {
      getUserFromToken: jest.fn().mockResolvedValue(opts.supabaseUser ?? null),
    } as unknown as SupabaseService;
    const prisma = {
      db: {
        akunInternal: { findFirst: jest.fn().mockResolvedValue(opts.internal ?? null) },
        akunMitra: { findFirst: jest.fn().mockResolvedValue(opts.mitra ?? null) },
      },
    } as unknown as PrismaService;
    return new SupabaseAuthGuard(supabase, prisma);
  }

  it('menolak request tanpa header Authorization', async () => {
    const guard = buildGuard({});
    const { context } = buildContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('menolak header Authorization yang bukan format Bearer', async () => {
    const guard = buildGuard({});
    const { context } = buildContext({ authorization: 'Basic abc123' });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: { error: { code: 'AUTH_HEADER_TIDAK_ADA' } },
    });
  });

  it('menolak token yang tidak valid di Supabase', async () => {
    const guard = buildGuard({ supabaseUser: null });
    const { context } = buildContext({ authorization: 'Bearer token-invalid' });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: { error: { code: 'TOKEN_TIDAK_VALID' } },
    });
  });

  it('menolak token Supabase valid TAPI belum terdaftar di AkunInternal maupun AkunMitra', async () => {
    const guard = buildGuard({ supabaseUser: { id: 'uid-1' }, internal: null, mitra: null });
    const { context } = buildContext({ authorization: 'Bearer token-valid' });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: { error: { code: 'AKUN_TIDAK_TERDAFTAR' } },
    });
  });

  it('meloloskan & mengisi request.user kind=internal kalau cocok AkunInternal', async () => {
    const internal = { id: 'ai-1', supabaseAuthUid: 'uid-1', email: 'a@b.com', nama: 'Admin', role: 'SUPER_ADMIN' };
    const guard = buildGuard({ supabaseUser: { id: 'uid-1' }, internal });
    const { context, request } = buildContext({ authorization: 'Bearer token-valid' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      kind: 'internal',
      id: 'ai-1',
      supabaseAuthUid: 'uid-1',
      email: 'a@b.com',
      nama: 'Admin',
      role: 'SUPER_ADMIN',
    });
  });

  it('meloloskan & mengisi request.user kind=mitra kalau cocok AkunMitra (bukan AkunInternal)', async () => {
    const mitra = { id: 'am-1', supabaseAuthUid: 'uid-2', email: 'mitra@b.com', nama: 'Mitra', mitraId: 'm-1' };
    const guard = buildGuard({ supabaseUser: { id: 'uid-2' }, internal: null, mitra });
    const { context, request } = buildContext({ authorization: 'Bearer token-valid' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      kind: 'mitra',
      id: 'am-1',
      supabaseAuthUid: 'uid-2',
      email: 'mitra@b.com',
      nama: 'Mitra',
      mitraId: 'm-1',
    });
  });
});
