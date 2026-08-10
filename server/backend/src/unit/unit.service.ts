import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { LogKategori } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import type { AuthenticatedInternalUser } from '../auth/types';
import type { CreateUnitDto } from './dto/create-unit.dto';
import type { UpdateUnitDto } from './dto/update-unit.dto';
import type { BukaPaksaDto } from './dto/buka-paksa.dto';
import type { LokerStatusDto } from './dto/loker-status.dto';

function generateUnitKey(): string {
  return `uk_${randomBytes(24).toString('hex')}`;
}

function nomorLokerFromIndex(index: number, total: number): string {
  const width = String(total).length;
  return String(index + 1).padStart(Math.max(2, width), '0');
}

/** Sertakan lokasi + mitra pemilik (via MitraLokasi) — dashboard perlu tahu "unit ini milik siapa". */
const unitListInclude = {
  lokasi: {
    include: {
      mitraLokasi: { include: { mitra: true } },
    },
  },
  lokers: true,
  durasiHarga: true,
} as const;

function omitUnitKey<T extends { unitKey: string }>({ unitKey: _unitKey, ...rest }: T) {
  return rest;
}

@Injectable()
export class UnitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async list(page: number, pageSize: number) {
    const [data, totalItems] = await Promise.all([
      this.prisma.db.unit.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: unitListInclude,
      }),
      this.prisma.db.unit.count(),
    ]);

    return {
      data: data.map(omitUnitKey),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  }

  async findOneOrThrow(id: string) {
    const unit = await this.prisma.db.unit.findUnique({
      where: { id },
      include: unitListInclude,
    });
    if (!unit) throw this.unitTidakDitemukan();

    // Riwayat transaksi (§5.1 "Detail unit + daftar loker + riwayat
    // transaksi") — 20 sesi terakhir lintas semua loker unit ini.
    const riwayatTransaksi = await this.prisma.db.sesiTransaksi.findMany({
      where: { loker: { unitId: id } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { loker: { select: { nomorLoker: true } } },
    });

    return { ...omitUnitKey(unit), riwayatTransaksi };
  }

  /**
   * `unitKey` HANYA muncul di response create ini — tidak pernah
   * dikembalikan lagi oleh endpoint lain (list/detail), selaras perlakuan
   * secret di §7.1.
   */
  async create(dto: CreateUnitDto) {
    const unitKey = generateUnitKey();

    return this.prisma.db.$transaction(async (tx) => {
      const unit = await tx.unit.create({
        data: {
          lokasiId: dto.lokasiId,
          kodeUnit: dto.kodeUnit,
          unitKey,
          varianKompartemen: dto.varianKompartemen,
          jumlahLoker: dto.jumlahLoker,
          modePemakaian: dto.modePemakaian,
        },
      });

      await tx.loker.createMany({
        data: Array.from({ length: dto.jumlahLoker }, (_, i) => ({
          unitId: unit.id,
          nomorLoker: nomorLokerFromIndex(i, dto.jumlahLoker),
        })),
      });

      await tx.unitDurasiHarga.createMany({
        data: dto.durasiHarga.map((d) => ({
          unitId: unit.id,
          durasiJam: d.durasiJam,
          harga: d.harga,
        })),
      });

      const lokers = await tx.loker.findMany({ where: { unitId: unit.id } });
      const durasiHarga = await tx.unitDurasiHarga.findMany({ where: { unitId: unit.id } });

      return { ...unit, lokers, durasiHarga };
    });
  }

  /**
   * docs/API-Contract-Smartbox.md §5.1 — PATCH /company/units/:id.
   * `durasiHarga`, kalau dikirim, di-sync (lihat catatan di
   * update-unit.dto.ts) — bukan replace destruktif.
   */
  async update(id: string, dto: UpdateUnitDto, actor: AuthenticatedInternalUser) {
    const existing = await this.prisma.db.unit.findUnique({ where: { id } });
    if (!existing) throw this.unitTidakDitemukan();

    const unit = await this.prisma.db.$transaction(async (tx) => {
      const updated = await tx.unit.update({
        where: { id },
        data: {
          varianKompartemen: dto.varianKompartemen,
          modePemakaian: dto.modePemakaian,
          aktif: dto.aktif,
        },
      });

      if (dto.durasiHarga) {
        const dikirimIds = dto.durasiHarga.filter((d) => d.id).map((d) => d.id!);

        await tx.unitDurasiHarga.updateMany({
          where: { unitId: id, id: { notIn: dikirimIds } },
          data: { aktif: false },
        });

        for (const d of dto.durasiHarga) {
          if (d.id) {
            await tx.unitDurasiHarga.update({
              where: { id: d.id },
              data: { durasiJam: d.durasiJam, harga: d.harga, aktif: true },
            });
          } else {
            await tx.unitDurasiHarga.create({
              data: { unitId: id, durasiJam: d.durasiJam, harga: d.harga },
            });
          }
        }
      }

      return updated;
    });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.OPERASIONAL,
      aksi: 'ubah_konfigurasi_unit',
      entitas: 'unit',
      entitasId: id,
      detail: dto,
    });

    return omitUnitKey(unit);
  }

  /** Soft delete (§6) — wajib alasan, dicatat ke LOG_AKTIVITAS. */
  async softDelete(id: string, alasan: string, actor: AuthenticatedInternalUser) {
    const existing = await this.prisma.db.unit.findUnique({ where: { id } });
    if (!existing) throw this.unitTidakDitemukan();

    await this.prisma.softDelete('unit', id);

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.OPERASIONAL,
      aksi: 'nonaktifkan_unit',
      entitas: 'unit',
      entitasId: id,
      detail: { alasan },
    });

    return { deleted: true };
  }

  /**
   * Remote force-open (§2 Tujuan Produk, §5.1) — wajib alasan, kategori
   * `keamanan` (§7.1), BUKAN EmergencyUnlockLog (itu untuk kunci fisik
   * manual oleh Staff, SMB-110; ini remote software trigger oleh
   * Super Admin/Ops).
   *
   * TODO (Epic 5, Gateway Hardware/MQTT — belum dibangun): sama seperti
   * kiosk-sewa.service.ts/kiosk-ambil.service.ts, seharusnya publish
   * perintah MQTT & tunggu ack sensor. Untuk sekarang cuma dicatat ke
   * LOG_AKTIVITAS tanpa konfirmasi hardware sungguhan.
   */
  async bukaPaksa(unitId: string, dto: BukaPaksaDto, actor: AuthenticatedInternalUser) {
    const loker = await this.prisma.db.loker.findFirst({
      where: { id: dto.lokerId, unitId },
    });
    if (!loker) {
      throw new NotFoundException({
        error: { code: 'LOKER_TIDAK_DITEMUKAN', message: 'Loker tidak ditemukan di unit ini.' },
      });
    }

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.KEAMANAN,
      aksi: 'buka_paksa_pintu',
      entitas: 'loker',
      entitasId: loker.id,
      detail: { alasan: dto.alasan },
    });

    return { triggered: true };
  }

  async updateLokerStatus(lokerId: string, dto: LokerStatusDto, actor: AuthenticatedInternalUser) {
    const loker = await this.prisma.db.loker.findUnique({ where: { id: lokerId } });
    if (!loker) {
      throw new NotFoundException({
        error: { code: 'LOKER_TIDAK_DITEMUKAN', message: 'Loker tidak ditemukan.' },
      });
    }
    if (loker.status === dto.status) {
      throw new ConflictException({
        error: { code: 'STATUS_SAMA', message: `Loker sudah berstatus ${dto.status}.` },
      });
    }

    const updated = await this.prisma.db.loker.update({
      where: { id: lokerId },
      data: { status: dto.status },
    });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.OPERASIONAL,
      aksi: 'ubah_status_loker',
      entitas: 'loker',
      entitasId: lokerId,
      detail: { dari: loker.status, ke: dto.status },
    });

    return updated;
  }

  private unitTidakDitemukan() {
    return new NotFoundException({
      error: { code: 'UNIT_TIDAK_DITEMUKAN', message: 'Unit tidak ditemukan.' },
    });
  }
}
