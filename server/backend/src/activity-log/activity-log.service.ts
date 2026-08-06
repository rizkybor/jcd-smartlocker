import { Injectable } from '@nestjs/common';
import { LogKategori } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type LogAktivitasInput = {
  aktorId: string;
  aktorRole: string;
  kategori: LogKategori;
  aksi: string;
  entitas: string;
  entitasId?: string;
  detail?: Record<string, unknown>;
};

/**
 * Satu-satunya jalan resmi menulis ke `log_aktivitas` — audit keamanan
 * (§7.1) & activity log operasional (§5.6) sekaligus, dibedakan lewat
 * `kategori`. Append-only secara desain: service ini SENGAJA tidak punya
 * method update/delete (docs/ERD-Smartbox.md).
 */
@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogAktivitasInput) {
    return this.prisma.db.logAktivitas.create({
      data: {
        aktorId: input.aktorId,
        aktorRole: input.aktorRole,
        kategori: input.kategori,
        aksi: input.aksi,
        entitas: input.entitas,
        entitasId: input.entitasId,
        detail: input.detail,
      },
    });
  }
}
