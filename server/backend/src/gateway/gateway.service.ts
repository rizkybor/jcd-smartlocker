import { Injectable, Logger } from '@nestjs/common';
import { LokerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const HEARTBEAT_OFFLINE_THRESHOLD_MS = 90_000; // 3x interval heartbeat (§4.1: tiap 30 detik)

/**
 * Logic inti gateway hardware ↔ backend (docs/API-Contract-Smartbox.md §4;
 * docs/PRD-Smartbox.md §8.1-§8.3, §9.1) — dipakai bersama oleh MQTT
 * subscriber (MqttClientService, jalur utama) dan HTTP fallback
 * (GatewayController, §4.2, dipakai kalau broker MQTT down).
 *
 * SMB-506/507 (Epic 5) — SMB-502-505/510 (service gateway fisik di Mini
 * PC, komunikasi serial/RS485 ke Main Controller Board) belum bisa
 * dikerjakan: belum ada unit fisik & protokol board tergantung vendor
 * final yang belum dikontrak (PRD §12 poin 1).
 */
@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  // In-memory — cukup untuk deteksi offline dasar (SMB-506); belum ada
  // kebutuhan persist ke DB sampai Dashboard Company (Epic 6+) benar-benar
  // menampilkan status kesehatan unit.
  private readonly lastHeartbeatAt = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  recordHeartbeat(kodeUnit: string) {
    this.lastHeartbeatAt.set(kodeUnit, Date.now());
    this.logger.debug(`Heartbeat dari unit ${kodeUnit}`);
  }

  /** true kalau heartbeat terakhir masih dalam ambang batas, atau belum pernah lapor sama sekali (unknown, bukan online). */
  isOnline(kodeUnit: string): boolean {
    const last = this.lastHeartbeatAt.get(kodeUnit);
    if (!last) return false;
    return Date.now() - last < HEARTBEAT_OFFLINE_THRESHOLD_MS;
  }

  async syncStatusLoker(kodeUnit: string, nomorLoker: string, status: LokerStatus) {
    const unit = await this.prisma.db.unit.findUnique({ where: { kodeUnit } });
    if (!unit) {
      this.logger.warn(`syncStatusLoker: unit ${kodeUnit} tidak ditemukan, pesan diabaikan.`);
      return;
    }

    const result = await this.prisma.db.loker.updateMany({
      where: { unitId: unit.id, nomorLoker },
      data: { status },
    });
    if (result.count === 0) {
      this.logger.warn(`syncStatusLoker: loker ${nomorLoker} di unit ${kodeUnit} tidak ditemukan.`);
    }
  }

  /**
   * `macet` seharusnya memicu alur eskalasi Ops (PRD §5.3) — dashboard
   * Company (Epic 6+) belum ada, jadi untuk sekarang cukup log terstruktur
   * supaya tetap terlihat di observability (§9.4), bukan hilang diam-diam.
   * JANGAN dipaksakan ke `LOG_AKTIVITAS` — tabel itu di-desain untuk aksi
   * ber-aktor manusia (`aktorId` wajib FK ke `AkunInternal`), bukan event
   * hardware otomatis.
   */
  handlePintuEvent(kodeUnit: string, nomorLoker: string, event: 'terbuka' | 'tertutup' | 'macet') {
    if (event === 'macet') {
      this.logger.error(`Pintu MACET — unit ${kodeUnit}, loker ${nomorLoker}. Butuh eskalasi Staff (Emergency Unlock, §5.3).`);
      return;
    }
    this.logger.log(`Event pintu unit ${kodeUnit} loker ${nomorLoker}: ${event}`);
  }

  handlePerintahAck(kodeUnit: string, sesiId: string, hasil: 'sukses' | 'gagal', alasan?: string) {
    this.logger.log(`Ack perintah unit ${kodeUnit} sesi ${sesiId}: ${hasil}${alasan ? ` (${alasan})` : ''}`);
  }
}
