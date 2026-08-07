import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUnitDto } from './dto/create-unit.dto';

function generateUnitKey(): string {
  return `uk_${randomBytes(24).toString('hex')}`;
}

function nomorLokerFromIndex(index: number, total: number): string {
  const width = String(total).length;
  return String(index + 1).padStart(Math.max(2, width), '0');
}

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page: number, pageSize: number) {
    const [data, totalItems] = await Promise.all([
      this.prisma.db.unit.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { lokers: true, durasiHarga: true },
      }),
      this.prisma.db.unit.count(),
    ]);

    return {
      data: data.map(({ unitKey: _unitKey, ...unit }) => unit),
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
      include: { lokers: true, durasiHarga: true },
    });
    if (!unit) {
      throw new NotFoundException({
        error: { code: 'UNIT_TIDAK_DITEMUKAN', message: 'Unit tidak ditemukan.' },
      });
    }
    const { unitKey: _unitKey, ...rest } = unit;
    return rest;
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
}
