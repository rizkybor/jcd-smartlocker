import { Injectable } from '@nestjs/common';
import type { LogKategori } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AktivitasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * docs/API-Contract-Smartbox.md §5.5 — activity log operasional (beda
   * dari audit keamanan meski satu tabel, dibedakan lewat `kategori`,
   * lihat activity-log/activity-log.service.ts). Read-only di sini — satu
   * satunya jalan MENULIS tetap ActivityLogService.log() (append-only,
   * §7.1), controller ini sengaja tidak punya POST/PATCH/DELETE.
   */
  async list(page: number, pageSize: number, kategori?: LogKategori) {
    const where = kategori ? { kategori } : {};

    const [data, totalItems] = await Promise.all([
      this.prisma.db.logAktivitas.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { aktor: { select: { nama: true, email: true } } },
      }),
      this.prisma.db.logAktivitas.count({ where }),
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
}
