import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subMonths } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';

const RETENSI_BULAN = 6;

/**
 * Purge nomor HP penyewa 6 bulan setelah sesi selesai (docs/PRD-Smartbox.md
 * §7, §12 poin 4; docs/ERD-Smartbox.md "SESI_TRANSAKSI").
 *
 * **Deviasi dari rekomendasi awal PRD §9.2** (BullMQ + Redis) — job ini
 * dijalankan lewat `@nestjs/schedule` (cron in-process), BUKAN BullMQ,
 * karena infrastruktur Redis (Epic 0 SMB-011) belum diprovisikan saat
 * ticket ini dikerjakan. Untuk satu job harian sederhana tanpa kebutuhan
 * retry/observability queue yang kompleks, cron in-process cukup memadai
 * untuk MVP. Migrasi ke BullMQ (worker terpisah, retry otomatis, dashboard
 * monitoring) bisa jadi ticket lanjutan begitu Redis tersedia — cukup
 * pindahkan isi `purgeNomorHpKedaluwarsa()` jadi job processor, logic-nya
 * tidak berubah.
 *
 * PENTING: hanya menghapus (null-kan) kolom `nomorHp` — baris
 * `SesiTransaksi` itu sendiri TIDAK PERNAH dihapus (§6), supaya laporan
 * & perhitungan bagi hasil (§10) tetap utuh.
 */
@Injectable()
export class PurgeService {
  private readonly logger = new Logger(PurgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeNomorHpKedaluwarsa(): Promise<number> {
    const cutoff = subMonths(new Date(), RETENSI_BULAN);

    const result = await this.prisma.db.sesiTransaksi.updateMany({
      where: {
        nomorHp: { not: null },
        waktuSelesai: { not: null, lt: cutoff },
      },
      data: { nomorHp: null },
    });

    if (result.count > 0) {
      this.logger.log(
        `Purge nomor HP: ${result.count} sesi transaksi di-anonimkan (retensi ${RETENSI_BULAN} bulan, cutoff ${cutoff.toISOString()}).`,
      );
    }

    return result.count;
  }
}
