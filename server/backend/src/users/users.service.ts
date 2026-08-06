import { ConflictException, Injectable } from '@nestjs/common';
import { LogKategori } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import type { AuthenticatedInternalUser } from '../auth/types';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserRoleDto } from './dto/update-user-role.dto';

/**
 * Manajemen User — docs/PRD-Smartbox.md §5.4, §7. Controller sudah
 * menegakkan "hanya Super Admin" lewat guard; service ini fokus ke
 * business logic provisioning, bukan otorisasi (jangan duplikasi cek role
 * di sini — satu sumber kebenaran di guard).
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async list(page: number, pageSize: number) {
    const [data, totalItems] = await Promise.all([
      this.prisma.db.akunInternal.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.db.akunInternal.count(),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  }

  async create(dto: CreateUserDto, actor: AuthenticatedInternalUser) {
    const existing = await this.prisma.db.akunInternal.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email sudah terdaftar sebagai akun internal.');
    }

    const supabaseUser = await this.supabase.createAuthUser(dto.email);

    try {
      const created = await this.prisma.db.akunInternal.create({
        data: {
          supabaseAuthUid: supabaseUser.id,
          nama: dto.nama,
          email: dto.email,
          role: dto.role,
        },
      });

      await this.activityLog.log({
        aktorId: actor.id,
        aktorRole: actor.role,
        kategori: LogKategori.KEAMANAN,
        aksi: 'provisioning_user',
        entitas: 'akun_internal',
        entitasId: created.id,
        detail: { email: created.email, role: created.role },
      });

      return created;
    } catch (err) {
      // Rollback akun Supabase Auth kalau insert Prisma gagal — jangan
      // tinggalkan akun Auth "yatim" tanpa baris AkunInternal.
      await this.supabase.deleteAuthUser(supabaseUser.id).catch(() => undefined);
      throw err;
    }
  }

  async updateRole(id: string, dto: UpdateUserRoleDto, actor: AuthenticatedInternalUser) {
    const before = await this.prisma.db.akunInternal.findUniqueOrThrow({ where: { id } });

    const updated = await this.prisma.db.akunInternal.update({
      where: { id },
      data: { role: dto.role },
    });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.KEAMANAN,
      aksi: 'ubah_role_user',
      entitas: 'akun_internal',
      entitasId: id,
      detail: { roleSebelum: before.role, roleSesudah: updated.role },
    });

    return updated;
  }

  async softDelete(id: string, actor: AuthenticatedInternalUser) {
    const result = await this.prisma.softDelete('akunInternal', id);

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.KEAMANAN,
      aksi: 'nonaktifkan_user',
      entitas: 'akun_internal',
      entitasId: id,
    });

    return result;
  }
}
