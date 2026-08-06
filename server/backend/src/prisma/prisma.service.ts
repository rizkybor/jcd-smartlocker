import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './soft-delete.extension';

type SoftDeleteModelKey =
  | 'lokasi'
  | 'mitra'
  | 'mitraLokasi'
  | 'unit'
  | 'loker'
  | 'akunInternal'
  | 'akunMitra';

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
  private readonly client = new PrismaClient();

  readonly db = this.client.$extends(softDeleteExtension);

  async onModuleInit() {
    await this.client.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  /**
   * Soft delete eksplisit — WAJIB dipakai untuk 7 model yang punya kolom
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
