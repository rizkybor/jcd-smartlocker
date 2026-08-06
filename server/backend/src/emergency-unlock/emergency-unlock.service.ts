import { Injectable, NotFoundException } from '@nestjs/common';
import { LogKategori } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { formatUtcInLokasiTimezone } from '../common/timezone.util';
import type { AuthenticatedInternalUser } from '../auth/types';
import type { CreateEmergencyUnlockDto } from './dto/create-emergency-unlock.dto';

/**
 * docs/PRD-Smartbox.md §5.3, §7.1; docs/ERD-Smartbox.md — append-only
 * secara desain. Service ini SENGAJA tidak punya method update/delete.
 */
@Injectable()
export class EmergencyUnlockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async list(page: number, pageSize: number) {
    const [rows, totalItems] = await Promise.all([
      this.prisma.db.emergencyUnlockLog.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { waktuKejadian: 'desc' },
        include: { loker: { include: { unit: { include: { lokasi: true } } } } },
      }),
      this.prisma.db.emergencyUnlockLog.count(),
    ]);

    // Waktu kejadian ditampilkan sesuai timezone lokasi loker terkait
    // (§7.2) — bukan UTC mentah, dan bukan asumsi WIB untuk semua lokasi.
    const data = rows.map(({ loker, ...row }) => ({
      ...row,
      waktuKejadianLokal: formatUtcInLokasiTimezone(
        row.waktuKejadian,
        loker.unit.lokasi.timezone,
      ),
    }));

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

  async create(dto: CreateEmergencyUnlockDto, actor: AuthenticatedInternalUser) {
    const loker = await this.prisma.db.loker.findUnique({ where: { id: dto.lokerId } });
    if (!loker) {
      throw new NotFoundException('Loker tidak ditemukan.');
    }

    const created = await this.prisma.db.emergencyUnlockLog.create({
      data: {
        lokerId: dto.lokerId,
        staffId: actor.id,
        catatan: dto.catatan,
        waktuKejadian: dto.waktuKejadian,
      },
    });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.KEAMANAN,
      aksi: 'catat_emergency_unlock',
      entitas: 'emergency_unlock_log',
      entitasId: created.id,
      detail: { lokerId: dto.lokerId, waktuKejadian: dto.waktuKejadian.toISOString() },
    });

    return created;
  }
}
