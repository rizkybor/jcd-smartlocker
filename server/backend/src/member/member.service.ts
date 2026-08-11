import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LogKategori } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import type { AuthenticatedInternalUser, AuthenticatedMitraUser } from '../auth/types';
import type {
  CreateMemberSuperAdminDto,
  UpdateMemberSuperAdminDto,
  CreateMemberMitraDto,
  UpdateMemberMitraDto,
} from './dto/member.dto';

/**
 * Member RFID/kode unik (fitur di luar cakupan PRD awal — permintaan bisnis
 * langsung, lihat catatan model `Member` di schema.prisma). Dua jalur:
 * Super Admin (bebas, termasuk ikat loker eksklusif) & Mitra (scoped ke
 * mitraId sendiri, cuma member umum/diskon — SENGAJA tidak boleh ikat
 * loker, itu keputusan Super Admin karena menyangkut kapasitas publik).
 */
@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // --- Super Admin ---

  /**
   * `mitraId` WAJIB — Super Admin bisa kelola member lintas semua mitra,
   * tapi harus MENENTUKAN DULU mitra mana yang mau dikelola (§ konfirmasi
   * bisnis) — bukan daftar tercampur semua mitra sekaligus. Ditegakkan di
   * sini (bukan cuma di UI dashboard-company) supaya panggilan API
   * langsung tanpa `mitraId` tetap ditolak jelas, bukan diam-diam
   * mengembalikan semua mitra.
   */
  async listForSuperAdmin(page: number, pageSize: number, mitraId?: string) {
    if (!mitraId) {
      throw new BadRequestException({
        error: { code: 'MITRA_ID_WAJIB', message: 'Pilih mitra dulu untuk melihat daftar member.' },
      });
    }
    const where = { mitraId };
    const [data, totalItems] = await Promise.all([
      this.prisma.db.member.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { mitra: { select: { nama: true } }, loker: { include: { unit: { select: { kodeUnit: true } } } } },
      }),
      this.prisma.db.member.count({ where }),
    ]);
    return { data, meta: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) } };
  }

  async createForSuperAdmin(dto: CreateMemberSuperAdminDto, actor: AuthenticatedInternalUser) {
    if (dto.lokerId) await this.assertLokerBolehDiikat(dto.lokerId);

    const member = await this.prisma.db.member.create({
      data: {
        mitraId: dto.mitraId,
        kode: dto.kode,
        nama: dto.nama,
        kontak: dto.kontak,
        lokerId: dto.lokerId,
        diskonPersen: dto.diskonPersen,
      },
    });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.OPERASIONAL,
      aksi: 'buat_member',
      entitas: 'member',
      entitasId: member.id,
      detail: { kode: dto.kode, lokerId: dto.lokerId ?? null, diskonPersen: dto.diskonPersen ?? null },
    });

    return member;
  }

  async updateForSuperAdmin(id: string, dto: UpdateMemberSuperAdminDto, actor: AuthenticatedInternalUser) {
    const existing = await this.prisma.db.member.findUnique({ where: { id } });
    if (!existing) throw this.memberTidakDitemukan();

    if (dto.lokerId) await this.assertLokerBolehDiikat(dto.lokerId, id);

    const updated = await this.prisma.db.member.update({
      where: { id },
      data: {
        nama: dto.nama,
        kontak: dto.kontak,
        lokerId: dto.lokerId,
        diskonPersen: dto.lokerId ? null : dto.diskonPersen,
        aktif: dto.aktif,
      },
    });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.OPERASIONAL,
      aksi: 'ubah_member',
      entitas: 'member',
      entitasId: id,
      detail: dto,
    });

    return updated;
  }

  async removeForSuperAdmin(id: string, actor: AuthenticatedInternalUser) {
    const existing = await this.prisma.db.member.findUnique({ where: { id } });
    if (!existing) throw this.memberTidakDitemukan();

    await this.prisma.softDelete('member', id);

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.OPERASIONAL,
      aksi: 'nonaktifkan_member',
      entitas: 'member',
      entitasId: id,
    });

    return { deleted: true };
  }

  /** Loker yang mau diikat WAJIB ada, milik unit aktif, & belum diikat member lain. */
  private async assertLokerBolehDiikat(lokerId: string, kecualiMemberId?: string) {
    const loker = await this.prisma.db.loker.findUnique({ where: { id: lokerId } });
    if (!loker) {
      throw new NotFoundException({ error: { code: 'LOKER_TIDAK_DITEMUKAN', message: 'Loker tidak ditemukan.' } });
    }
    const sudahDiikat = await this.prisma.db.member.findFirst({
      where: { lokerId, ...(kecualiMemberId ? { id: { not: kecualiMemberId } } : {}) },
    });
    if (sudahDiikat) {
      throw new ConflictException({
        error: { code: 'LOKER_SUDAH_DIIKAT_MEMBER', message: 'Loker ini sudah diikat ke member lain.' },
      });
    }
  }

  // --- Mitra (scoped, member umum/diskon saja — TIDAK PERNAH lokerId) ---

  async listForMitra(actor: AuthenticatedMitraUser, page: number, pageSize: number) {
    await this.assertBolehKelolaMember(actor);
    const where = { mitraId: actor.mitraId };
    const [data, totalItems] = await Promise.all([
      this.prisma.db.member.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.db.member.count({ where }),
    ]);
    return { data, meta: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) } };
  }

  async createForMitra(actor: AuthenticatedMitraUser, dto: CreateMemberMitraDto) {
    await this.assertBolehKelolaMember(actor);
    return this.prisma.db.member.create({
      data: {
        mitraId: actor.mitraId,
        kode: dto.kode,
        nama: dto.nama,
        kontak: dto.kontak,
        diskonPersen: dto.diskonPersen,
      },
    });
  }

  async updateForMitra(actor: AuthenticatedMitraUser, id: string, dto: UpdateMemberMitraDto) {
    await this.assertBolehKelolaMember(actor);
    const existing = await this.assertMemberMilikMitra(actor, id);
    return this.prisma.db.member.update({
      where: { id: existing.id },
      data: { nama: dto.nama, kontak: dto.kontak, diskonPersen: dto.diskonPersen, aktif: dto.aktif },
    });
  }

  async removeForMitra(actor: AuthenticatedMitraUser, id: string) {
    await this.assertBolehKelolaMember(actor);
    const existing = await this.assertMemberMilikMitra(actor, id);
    await this.prisma.softDelete('member', existing.id);
    return { deleted: true };
  }

  /**
   * Fitur member RFID (di luar cakupan PRD awal) — mitra HANYA boleh akses
   * SEMUA endpoint `/mitra/members/*` kalau Super Admin sudah mengaktifkan
   * `Mitra.bolehKelolaMember` (default false, lihat catatan schema.prisma).
   * Dicek di SETIAP method tulis+baca mitra di sini (bukan cuma di
   * controller/UI) supaya tidak ada jalan pintas kalau ada endpoint baru
   * lupa dipasangi guard di level lain.
   */
  private async assertBolehKelolaMember(actor: AuthenticatedMitraUser) {
    const mitra = await this.prisma.db.mitra.findUnique({
      where: { id: actor.mitraId },
      select: { bolehKelolaMember: true },
    });
    if (!mitra?.bolehKelolaMember) {
      throw new ForbiddenException({
        error: {
          code: 'MITRA_TIDAK_BOLEH_KELOLA_MEMBER',
          message: 'Mitra Anda belum diberi akses mengelola member — hubungi Super Admin.',
        },
      });
    }
  }

  private async assertMemberMilikMitra(actor: AuthenticatedMitraUser, id: string) {
    const member = await this.prisma.db.member.findUnique({ where: { id } });
    if (!member) throw this.memberTidakDitemukan();
    if (member.mitraId !== actor.mitraId) {
      throw new ForbiddenException({
        error: { code: 'MEMBER_BUKAN_MILIK_ANDA', message: 'Member ini bukan milik mitra Anda.' },
      });
    }
    if (member.lokerId) {
      // Jaga-jaga: mitra tidak pernah membuat member terikat loker, tapi
      // kalau Super Admin yang bikin lalu mitra coba edit, tolak tegas —
      // pengikatan loker cuma boleh diubah Super Admin (§ konfirmasi bisnis).
      throw new ForbiddenException({
        error: { code: 'MEMBER_TERIKAT_LOKER', message: 'Member yang terikat loker spesifik hanya bisa dikelola Super Admin.' },
      });
    }
    return member;
  }

  private memberTidakDitemukan() {
    return new NotFoundException({ error: { code: 'MEMBER_TIDAK_DITEMUKAN', message: 'Member tidak ditemukan.' } });
  }
}
