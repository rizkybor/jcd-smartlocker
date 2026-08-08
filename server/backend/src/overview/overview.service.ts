import { Injectable } from '@nestjs/common';
import { LokerStatus, StatusBayar } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';

/**
 * docs/API-Contract-Smartbox.md §5.1 — GET /company/overview (SMB-601).
 */
@Injectable()
export class OverviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayService: GatewayService,
  ) {}

  async ringkasan() {
    const [jumlahLokasi, units, lokerPerStatusRaw, pendapatan] = await Promise.all([
      this.prisma.db.lokasi.count(),
      this.prisma.db.unit.findMany({ select: { kodeUnit: true } }),
      this.prisma.db.loker.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.db.sesiTransaksi.aggregate({
        where: { statusBayar: StatusBayar.PAID },
        _sum: { nominal: true },
      }),
    ]);

    const lokerPerStatus: Record<Lowercase<LokerStatus>, number> = {
      tersedia: 0,
      terisi: 0,
      maintenance: 0,
      offline: 0,
      nonaktif: 0,
    };
    for (const row of lokerPerStatusRaw) {
      lokerPerStatus[row.status.toLowerCase() as Lowercase<LokerStatus>] = row._count._all;
    }
    const jumlahLoker = Object.values(lokerPerStatus).reduce((a, b) => a + b, 0);
    const okupansiPersen = jumlahLoker === 0 ? 0 : Math.round((lokerPerStatus.terisi / jumlahLoker) * 1000) / 10;

    const unitOnline = units.filter((u) => this.gatewayService.isOnline(u.kodeUnit)).length;

    return {
      jumlahLokasi,
      jumlahUnit: units.length,
      jumlahLoker,
      lokerPerStatus,
      okupansiPersen,
      pendapatanTotal: Number(pendapatan._sum.nominal ?? 0),
      unitOnline,
      unitOffline: units.length - unitOnline,
    };
  }
}
