import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AkunInternalRole } from '@prisma/client';
import { MemberService } from './member.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ActivityLogService } from '../activity-log/activity-log.service';
import type { AuthenticatedInternalUser, AuthenticatedMitraUser } from '../auth/types';

/**
 * Fitur member RFID/kode unik (di luar cakupan PRD awal — lihat catatan
 * model `Member` di schema.prisma). Logika paling berisiko: (1) pengikatan
 * loker eksklusif harus tolak konflik & saling-eksklusif dengan diskon,
 * (2) mitra CUMA boleh kelola member umum miliknya sendiri — TIDAK PERNAH
 * bisa mengikat loker (itu keputusan sadar Super Admin, lihat
 * dashboard-mitra.controller.ts).
 */
describe('MemberService', () => {
  const superAdmin: AuthenticatedInternalUser = {
    kind: 'internal',
    id: 'admin-1',
    supabaseAuthUid: 'uid-1',
    email: 'admin@test.com',
    nama: 'Admin',
    role: AkunInternalRole.SUPER_ADMIN,
  };
  const mitraUser: AuthenticatedMitraUser = {
    kind: 'mitra',
    id: 'mitra-akun-1',
    supabaseAuthUid: 'uid-2',
    email: 'mitra@test.com',
    nama: 'Mitra User',
    mitraId: 'mitra-1',
  };

  function buildService(overrides: { member?: unknown; lokerFindUnique?: unknown; memberFindFirst?: unknown; bolehKelolaMember?: boolean } = {}) {
    const memberCreate = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'member-new', ...data }));
    const memberUpdate = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'member-1', ...data }));

    const prisma = {
      db: {
        member: {
          findUnique: jest.fn().mockResolvedValue(overrides.member !== undefined ? overrides.member : { id: 'member-1', mitraId: 'mitra-1', lokerId: null }),
          findFirst: jest.fn().mockResolvedValue(overrides.memberFindFirst !== undefined ? overrides.memberFindFirst : null),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          create: memberCreate,
          update: memberUpdate,
        },
        loker: {
          findUnique: jest.fn().mockResolvedValue(overrides.lokerFindUnique !== undefined ? overrides.lokerFindUnique : { id: 'loker-1' }),
        },
        mitra: {
          findUnique: jest.fn().mockResolvedValue({ bolehKelolaMember: overrides.bolehKelolaMember ?? true }),
        },
      },
      softDelete: jest.fn().mockResolvedValue({ deleted: true }),
    } as unknown as PrismaService;

    const activityLog = { log: jest.fn().mockResolvedValue(undefined) } as unknown as ActivityLogService;

    return { service: new MemberService(prisma, activityLog), prisma, activityLog, memberCreate, memberUpdate };
  }

  describe('listForSuperAdmin — Super Admin wajib pilih mitra dulu', () => {
    it('lempar BadRequestException MITRA_ID_WAJIB kalau mitraId tidak dikirim', async () => {
      const { service } = buildService();

      await expect(service.listForSuperAdmin(1, 25)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.listForSuperAdmin(1, 25, undefined)).rejects.toMatchObject({
        response: { error: { code: 'MITRA_ID_WAJIB' } },
      });
    });

    it('scoped ke mitraId yang dikirim kalau ada', async () => {
      const { service, prisma } = buildService();

      await service.listForSuperAdmin(1, 25, 'mitra-1');

      expect(prisma.db.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { mitraId: 'mitra-1' } }),
      );
    });
  });

  describe('createForSuperAdmin', () => {
    it('lempar NotFoundException kalau lokerId yang mau diikat tidak ada', async () => {
      const { service } = buildService({ lokerFindUnique: null });

      await expect(
        service.createForSuperAdmin({ mitraId: 'mitra-1', kode: 'RFID-1', nama: 'A', lokerId: 'loker-x' }, superAdmin),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lempar ConflictException kalau loker sudah diikat member lain', async () => {
      const { service } = buildService({ memberFindFirst: { id: 'member-lain' } });

      await expect(
        service.createForSuperAdmin({ mitraId: 'mitra-1', kode: 'RFID-1', nama: 'A', lokerId: 'loker-1' }, superAdmin),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('boleh buat member eksklusif kalau loker valid & belum diikat', async () => {
      const { service, memberCreate, activityLog } = buildService();

      const result = await service.createForSuperAdmin(
        { mitraId: 'mitra-1', kode: 'RFID-1', nama: 'A', lokerId: 'loker-1' },
        superAdmin,
      );

      expect(memberCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ lokerId: 'loker-1', mitraId: 'mitra-1' }) }),
      );
      expect(result.id).toBe('member-new');
      expect(activityLog.log).toHaveBeenCalledWith(expect.objectContaining({ aksi: 'buat_member' }));
    });

    it('boleh buat member umum dengan diskonPersen (tanpa lokerId)', async () => {
      const { service, memberCreate } = buildService();

      await service.createForSuperAdmin({ mitraId: 'mitra-1', kode: 'RFID-2', nama: 'B', diskonPersen: 15 }, superAdmin);

      expect(memberCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ lokerId: undefined, diskonPersen: 15 }) }),
      );
    });
  });

  describe('updateForSuperAdmin', () => {
    it('lempar NotFoundException kalau member tidak ada', async () => {
      const { service } = buildService({ member: null });

      await expect(service.updateForSuperAdmin('member-x', { nama: 'X' }, superAdmin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lempar ConflictException kalau lokerId baru sudah diikat member lain', async () => {
      const { service } = buildService({ memberFindFirst: { id: 'member-lain' } });

      await expect(
        service.updateForSuperAdmin('member-1', { lokerId: 'loker-1' }, superAdmin),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('Mitra — hanya member umum miliknya sendiri', () => {
    it('createForMitra SELALU pakai mitraId dari actor, TIDAK PERNAH terima lokerId (skema DTO mitra tidak punya field itu)', async () => {
      const { service, memberCreate } = buildService();

      await service.createForMitra(mitraUser, { kode: 'RFID-3', nama: 'C', diskonPersen: 10 });

      expect(memberCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ mitraId: 'mitra-1', diskonPersen: 10 }) }),
      );
    });

    it('updateForMitra lempar ForbiddenException kalau member bukan milik mitra ini', async () => {
      const { service } = buildService({ member: { id: 'member-1', mitraId: 'mitra-LAIN', lokerId: null } });

      await expect(service.updateForMitra(mitraUser, 'member-1', { nama: 'X' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('updateForMitra lempar ForbiddenException kalau member terikat loker eksklusif (Super Admin only)', async () => {
      const { service } = buildService({ member: { id: 'member-1', mitraId: 'mitra-1', lokerId: 'loker-1' } });

      await expect(service.updateForMitra(mitraUser, 'member-1', { nama: 'X' })).rejects.toMatchObject({
        response: { error: { code: 'MEMBER_TERIKAT_LOKER' } },
      });
    });

    it('updateForMitra sukses untuk member umum miliknya sendiri', async () => {
      const { service, memberUpdate } = buildService({ member: { id: 'member-1', mitraId: 'mitra-1', lokerId: null } });

      await service.updateForMitra(mitraUser, 'member-1', { diskonPersen: 25 });

      expect(memberUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'member-1' }, data: expect.objectContaining({ diskonPersen: 25 }) }),
      );
    });

    it('removeForMitra lempar ForbiddenException kalau member bukan miliknya', async () => {
      const { service } = buildService({ member: { id: 'member-1', mitraId: 'mitra-LAIN', lokerId: null } });

      await expect(service.removeForMitra(mitraUser, 'member-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    describe('akses dikunci Super Admin (Mitra.bolehKelolaMember)', () => {
      it('listForMitra lempar ForbiddenException MITRA_TIDAK_BOLEH_KELOLA_MEMBER kalau belum diberi akses', async () => {
        const { service } = buildService({ bolehKelolaMember: false });

        await expect(service.listForMitra(mitraUser, 1, 25)).rejects.toMatchObject({
          response: { error: { code: 'MITRA_TIDAK_BOLEH_KELOLA_MEMBER' } },
        });
      });

      it('createForMitra lempar ForbiddenException kalau belum diberi akses', async () => {
        const { service } = buildService({ bolehKelolaMember: false });

        await expect(
          service.createForMitra(mitraUser, { kode: 'RFID-X', nama: 'X', diskonPersen: 10 }),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });

      it('updateForMitra & removeForMitra lempar ForbiddenException kalau belum diberi akses', async () => {
        const { service } = buildService({ bolehKelolaMember: false, member: { id: 'member-1', mitraId: 'mitra-1', lokerId: null } });

        await expect(service.updateForMitra(mitraUser, 'member-1', { nama: 'X' })).rejects.toBeInstanceOf(ForbiddenException);
        await expect(service.removeForMitra(mitraUser, 'member-1')).rejects.toBeInstanceOf(ForbiddenException);
      });

      it('boleh akses penuh begitu Mitra.bolehKelolaMember true', async () => {
        const { service } = buildService({ bolehKelolaMember: true });

        await expect(service.listForMitra(mitraUser, 1, 25)).resolves.toBeDefined();
      });
    });
  });
});
