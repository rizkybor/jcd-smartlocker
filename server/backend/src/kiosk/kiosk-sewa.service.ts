import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Unit } from '@prisma/client';
import { LokerStatus, StatusBayar } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_PROVIDER } from '../payment/payment-provider.interface';
import type { PaymentProvider } from '../payment/payment-provider.interface';
import { formatUtcInLokasiTimezone } from '../common/timezone.util';
import type { MulaiSewaDto } from './dto/mulai-sewa.dto';

function generateIdTransaksi(): string {
  return `SB-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/**
 * Alur sewa loker (docs/PRD-Smartbox.md §5.1; docs/API-Contract-Smartbox.md
 * §2).
 */
@Injectable()
export class KioskSewaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  async statusUnit(unit: Unit) {
    const [durasiHarga, jumlahTersedia, jumlahTotal] = await Promise.all([
      this.prisma.db.unitDurasiHarga.findMany({
        where: { unitId: unit.id, aktif: true },
        orderBy: { durasiJam: 'asc' },
      }),
      this.prisma.db.loker.count({ where: { unitId: unit.id, status: LokerStatus.TERSEDIA } }),
      this.prisma.db.loker.count({ where: { unitId: unit.id } }),
    ]);

    return {
      kodeUnit: unit.kodeUnit,
      modePemakaian: unit.modePemakaian,
      unitPenuh: jumlahTersedia === 0,
      jumlahTersedia,
      jumlahTotal,
      durasiHarga: durasiHarga.map((d) => ({
        id: d.id,
        durasiJam: d.durasiJam,
        harga: Number(d.harga),
      })),
    };
  }

  /**
   * Assign loker otomatis — WAJIB atomik (docs/API-Contract-Smartbox.md
   * §2, catatan kritis): `SELECT ... FOR UPDATE SKIP LOCKED` di dalam
   * transaksi supaya dua request bersamaan tidak pernah mengklaim loker
   * `tersedia` yang sama. Prisma query builder tidak punya row-locking
   * eksplisit, jadi baris ini pakai raw SQL yang scoped ke transaksi.
   */
  async mulaiSewa(unit: Unit, dto: MulaiSewaDto) {
    const durasiHarga = await this.prisma.db.unitDurasiHarga.findFirst({
      where: { id: dto.unitDurasiHargaId, unitId: unit.id, aktif: true },
    });
    if (!durasiHarga) {
      throw new NotFoundException({
        error: {
          code: 'DURASI_TIDAK_DITEMUKAN',
          message: 'Pilihan durasi tidak ditemukan untuk unit ini.',
        },
      });
    }

    return this.prisma.db.$transaction(async (tx) => {
      const kandidat = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM loker
        WHERE unit_id = ${unit.id}::uuid
          AND status = 'tersedia'
          AND deleted_at IS NULL
        ORDER BY nomor_loker
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      const loker = kandidat[0];
      if (!loker) {
        throw new ConflictException({
          error: {
            code: 'LOKER_TIDAK_TERSEDIA',
            message: 'Loker yang dipilih baru saja terisi. Silakan pilih loker lain.',
          },
        });
      }

      await tx.loker.update({ where: { id: loker.id }, data: { status: LokerStatus.TERISI } });

      return tx.sesiTransaksi.create({
        data: {
          lokerId: loker.id,
          unitDurasiHargaId: durasiHarga.id,
          nomorHp: dto.nomorHp,
          nominal: durasiHarga.harga,
          idTransaksi: generateIdTransaksi(),
          paymentProvider: this.paymentProvider.name,
        },
      });
    });
  }

  async buatPembayaran(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({ where: { id: sesiId } });
    if (!sesi) throw this.sesiTidakDitemukan();

    if (sesi.statusBayar !== StatusBayar.PENDING) {
      throw new ConflictException({
        error: {
          code: 'SESI_SUDAH_DIPROSES',
          message: 'Sesi ini sudah diproses sebelumnya, tidak bisa buat pembayaran baru.',
        },
      });
    }

    const charge = await this.paymentProvider.createQrisCharge({
      idTransaksi: sesi.idTransaksi,
      nominal: Number(sesi.nominal),
    });

    await this.prisma.db.sesiTransaksi.update({
      where: { id: sesi.id },
      data: { paymentProviderRefId: charge.providerRefId },
    });

    return {
      qrString: charge.qrString,
      expiredAt: charge.expiredAt,
      nominal: Number(sesi.nominal),
    };
  }

  async getStatusBayar(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({
      where: { id: sesiId },
      select: { statusBayar: true },
    });
    if (!sesi) throw this.sesiTidakDitemukan();
    return { statusBayar: sesi.statusBayar };
  }

  /**
   * TODO (Epic 5, Gateway Hardware/MQTT — belum dibangun): endpoint ini
   * seharusnya publish perintah `buka_pintu` ke topik MQTT
   * `unit/{kodeUnit}/perintah` (docs/API-Contract-Smartbox.md §4.1) dan
   * menunggu ack sebelum sesi dianggap aktif. Broker MQTT/gateway service
   * belum ada, jadi untuk sekarang statusnya langsung ditandai aktif di
   * database tanpa konfirmasi hardware sungguhan — JANGAN dianggap
   * "pintu benar-benar terbuka" sampai Epic 5 selesai.
   */
  async bukaPintu(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({
      where: { id: sesiId },
      include: { unitDurasiHarga: true },
    });
    if (!sesi) throw this.sesiTidakDitemukan();

    if (sesi.statusBayar !== StatusBayar.PAID) {
      throw new ConflictException({
        error: {
          code: 'SESI_BELUM_DIBAYAR',
          message: 'Pembayaran belum terkonfirmasi, pintu tidak bisa dibuka.',
        },
      });
    }

    if (sesi.waktuMulai) {
      // Idempotent — sudah pernah dibuka sebelumnya.
      return sesi;
    }

    const waktuMulai = new Date();
    const waktuSelesai = new Date(
      waktuMulai.getTime() + sesi.unitDurasiHarga.durasiJam * 60 * 60 * 1000,
    );

    return this.prisma.db.sesiTransaksi.update({
      where: { id: sesi.id },
      data: { waktuMulai, waktuSelesai },
    });
  }

  async getStruk(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({
      where: { id: sesiId },
      include: {
        loker: { include: { unit: { include: { lokasi: true } } } },
        unitDurasiHarga: true,
      },
    });
    if (!sesi) throw this.sesiTidakDitemukan();

    const timezone = sesi.loker.unit.lokasi.timezone;

    return {
      idTransaksi: sesi.idTransaksi,
      nomorLoker: sesi.loker.nomorLoker,
      durasiJam: sesi.unitDurasiHarga.durasiJam,
      nominal: Number(sesi.nominal),
      berlakuSampai: sesi.waktuSelesai
        ? formatUtcInLokasiTimezone(sesi.waktuSelesai, timezone)
        : null,
    };
  }

  private sesiTidakDitemukan() {
    return new NotFoundException({
      error: { code: 'SESI_TIDAK_DITEMUKAN', message: 'Sesi transaksi tidak ditemukan.' },
    });
  }
}
