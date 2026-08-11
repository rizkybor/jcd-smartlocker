import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './soft-delete.extension';

type SoftDeleteModelKey =
  | 'lokasi'
  | 'mitra'
  | 'mitraLokasi'
  | 'unit'
  | 'loker'
  | 'akunInternal'
  | 'akunMitra'
  | 'member';

/**
 * Wrapper PrismaClient sebagai provider NestJS.
 *
 * Pakai `db` (bukan mengakses PrismaClient mentah) untuk semua query domain
 * — sudah dilengkapi filter soft-delete otomatis di sisi baca
 * (soft-delete.extension.ts). Komposisi (bukan `extends PrismaClient`)
 * dipakai di sini supaya tipe hasil `$extends()` tidak konflik dengan tipe
 * class NestJS — lihat catatan di soft-delete.extension.ts.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  // Driver adapter (Prisma 7-ready — lihat prisma/schema.prisma). Konstruksi
  // di sini (bukan top-level module), supaya process.env.DATABASE_URL sudah
  // ke-load ConfigModule.forRoot() saat Nest resolve provider ini — bukan
  // saat file di-import (lebih awal dari itu). Query lewat pooler pgbouncer
  // (DATABASE_URL, port 6543); hanya `prisma migrate` (prisma.config.ts)
  // yang pakai DIRECT_URL.
  // connectionTimeoutMillis: tanpa ini, request yang query DB saat
  // koneksi terputus/tidak sampai akan hang tanpa batas (client HTTP
  // tidak pernah dapat respons) alih-alih gagal cepat dengan error jelas.
  private readonly adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
  });
  private readonly client = new PrismaClient({ adapter: this.adapter });

  readonly db = this.client.$extends(softDeleteExtension);

  async onModuleInit() {
    await this.client.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  /**
   * Soft delete eksplisit — WAJIB dipakai untuk 8 model yang punya kolom
   * `deletedAt` (docs/ERD-Smartbox.md, docs/PRD-Smartbox.md §6), bukan
   * `db.<model>.delete()`/`deleteMany()` langsung (itu tetap hard delete
   * kalau dipanggil — jangan dipakai untuk model-model ini).
   */
  async softDelete(model: SoftDeleteModelKey, id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.db[model] as any).update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
