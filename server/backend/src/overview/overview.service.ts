import { Injectable, NotFoundException } from '@nestjs/common';
import { LokerStatus, StatusBayar } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { computeOverdueStatus, tarifPerJamTermurah } from '../common/overdue.util';

const TREN_HARI = 14;

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

  /**
   * Tren transaksi/pendapatan N hari terakhir (di luar cakupan PRD awal —
   * permintaan bisnis langsung, monitoring Overview Super Admin). Satu
   * query `findMany` (bukan 1 query per hari) lalu dikelompokkan per
   * tanggal di memori — kecil (maks beberapa ratus baris utk 14 hari).
   *
   * Bucket tanggal dihitung MURNI di UTC (`setUTCDate`/`setUTCHours`,
   * bukan `setDate`/`setHours` lokal) — agregat lintas-mitra/lokasi ini
   * tidak py 1 timezone tunggal yang bermakna (beda dari struk kiosk yang
   * memang harus pakai timezone Lokasi spesifik, lihat timezone.util.ts).
   * Kalau batas bucket dihitung di waktu lokal server tapi key-nya
   * `.toISOString()` (selalu UTC), pergeseran offset timezone bisa bikin
   * bucket "hari ini" salah geser 1 hari — WAJIB konsisten UTC di kedua sisi.
   */
  async tren() {
    const mulai = new Date();
    mulai.setUTCDate(mulai.getUTCDate() - (TREN_HARI - 1));
    mulai.setUTCHours(0, 0, 0, 0);

    const sesiList = await this.prisma.db.sesiTransaksi.findMany({
      where: { statusBayar: StatusBayar.PAID, createdAt: { gte: mulai } },
      select: { createdAt: true, nominal: true },
    });

    const perTanggal = new Map<string, { jumlahTransaksi: number; pendapatan: number }>();
    for (let i = 0; i < TREN_HARI; i++) {
      const d = new Date(mulai);
      d.setUTCDate(d.getUTCDate() + i);
      perTanggal.set(d.toISOString().slice(0, 10), { jumlahTransaksi: 0, pendapatan: 0 });
    }
    for (const sesi of sesiList) {
      const tanggal = sesi.createdAt.toISOString().slice(0, 10);
      const bucket = perTanggal.get(tanggal);
      if (!bucket) continue;
      bucket.jumlahTransaksi += 1;
      bucket.pendapatan += Number(sesi.nominal);
    }

    return {
      data: [...perTanggal.entries()].map(([tanggal, v]) => ({ tanggal, ...v })),
    };
  }

  /**
   * Rollup per-mitra (di luar cakupan PRD awal) — `Unit.mitraId` sekarang
   * jadi sumber kebenaran LANGSUNG kepemilikan unit, jadi tidak perlu lagi
   * join lewat Lokasi/MitraLokasi untuk tahu "unit ini milik mitra mana".
   */
  async mitraRingkasan() {
    const mitraList = await this.prisma.db.mitra.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        units: {
          select: {
            id: true,
            lokers: { select: { id: true, status: true } },
          },
        },
      },
    });

    const semuaLokerIds = mitraList.flatMap((m) => m.units.flatMap((u) => u.lokers.map((l) => l.id)));
    const awalBulan = new Date();
    awalBulan.setDate(1);
    awalBulan.setHours(0, 0, 0, 0);

    const [transaksiBulanIni, transaksiTotal] = await Promise.all([
      semuaLokerIds.length
        ? this.prisma.db.sesiTransaksi.findMany({
            where: { lokerId: { in: semuaLokerIds }, statusBayar: StatusBayar.PAID, createdAt: { gte: awalBulan } },
            select: { lokerId: true, nominal: true },
          })
        : [],
      semuaLokerIds.length
        ? this.prisma.db.sesiTransaksi.findMany({
            where: { lokerId: { in: semuaLokerIds }, statusBayar: StatusBayar.PAID },
            select: { lokerId: true, nominal: true },
          })
        : [],
    ]);

    const lokerIdKeMitra = new Map<string, string>();
    for (const m of mitraList) {
      for (const u of m.units) {
        for (const l of u.lokers) lokerIdKeMitra.set(l.id, m.id);
      }
    }
    const jumlahkanPerMitra = (transaksi: { lokerId: string; nominal: unknown }[]) => {
      const hasil = new Map<string, number>();
      for (const t of transaksi) {
        const mitraId = lokerIdKeMitra.get(t.lokerId);
        if (!mitraId) continue;
        hasil.set(mitraId, (hasil.get(mitraId) ?? 0) + Number(t.nominal));
      }
      return hasil;
    };
    const pendapatanBulanIniPerMitra = jumlahkanPerMitra(transaksiBulanIni);
    const pendapatanTotalPerMitra = jumlahkanPerMitra(transaksiTotal);

    return {
      data: mitraList.map((m) => {
        const semuaLoker = m.units.flatMap((u) => u.lokers);
        const terisi = semuaLoker.filter((l) => l.status === LokerStatus.TERISI).length;
        const okupansiPersen = semuaLoker.length === 0 ? 0 : Math.round((terisi / semuaLoker.length) * 1000) / 10;
        return {
          mitraId: m.id,
          mitraNama: m.nama,
          jumlahUnit: m.units.length,
          okupansiPersen,
          pendapatanBulanIni: pendapatanBulanIniPerMitra.get(m.id) ?? 0,
          pendapatanTotal: pendapatanTotalPerMitra.get(m.id) ?? 0,
        };
      }),
    };
  }

  /**
   * Detail penghasilan 1 mitra: total & bulan ini, dirinci per Unit Locker
   * (di luar cakupan PRD awal — permintaan bisnis langsung, dipakai
   * MitraDetailPage). `groupBy` sekali per rentang waktu (bukan per-unit
   * query) lalu dijumlah per unit di memori.
   */
  async mitraDetailPenghasilan(mitraId: string) {
    const mitra = await this.prisma.db.mitra.findUnique({
      where: { id: mitraId },
      include: {
        units: {
          include: {
            lokasi: { select: { nama: true } },
            lokers: { select: { id: true, status: true } },
          },
        },
      },
    });
    if (!mitra) {
      throw new NotFoundException({ error: { code: 'MITRA_TIDAK_DITEMUKAN', message: 'Mitra tidak ditemukan.' } });
    }

    const semuaLokerIds = mitra.units.flatMap((u) => u.lokers.map((l) => l.id));
    const awalBulan = new Date();
    awalBulan.setDate(1);
    awalBulan.setHours(0, 0, 0, 0);

    const [totalPerLoker, bulanIniPerLoker] = await Promise.all([
      semuaLokerIds.length
        ? this.prisma.db.sesiTransaksi.groupBy({
            by: ['lokerId'],
            where: { lokerId: { in: semuaLokerIds }, statusBayar: StatusBayar.PAID },
            _sum: { nominal: true },
          })
        : [],
      semuaLokerIds.length
        ? this.prisma.db.sesiTransaksi.groupBy({
            by: ['lokerId'],
            where: { lokerId: { in: semuaLokerIds }, statusBayar: StatusBayar.PAID, createdAt: { gte: awalBulan } },
            _sum: { nominal: true },
          })
        : [],
    ]);
    const totalMap = new Map(totalPerLoker.map((r) => [r.lokerId, Number(r._sum.nominal ?? 0)]));
    const bulanIniMap = new Map(bulanIniPerLoker.map((r) => [r.lokerId, Number(r._sum.nominal ?? 0)]));

    const units = mitra.units.map((u) => {
      const lokerIds = u.lokers.map((l) => l.id);
      const pendapatanTotal = lokerIds.reduce((s, id) => s + (totalMap.get(id) ?? 0), 0);
      const pendapatanBulanIni = lokerIds.reduce((s, id) => s + (bulanIniMap.get(id) ?? 0), 0);
      const terisi = u.lokers.filter((l) => l.status === LokerStatus.TERISI).length;
      const okupansiPersen = u.lokers.length === 0 ? 0 : Math.round((terisi / u.lokers.length) * 1000) / 10;
      return {
        unitId: u.id,
        kodeUnit: u.kodeUnit,
        lokasiNama: u.lokasi.nama,
        jumlahLoker: u.lokers.length,
        okupansiPersen,
        pendapatanBulanIni,
        pendapatanTotal,
      };
    });

    return {
      mitraId: mitra.id,
      mitraNama: mitra.nama,
      pendapatanTotal: units.reduce((s, u) => s + u.pendapatanTotal, 0),
      pendapatanBulanIni: units.reduce((s, u) => s + u.pendapatanBulanIni, 0),
      units,
    };
  }

  /**
   * Daftar semua loker lintas unit, filterable (di luar cakupan PRD awal).
   * `lastActivityAt`/`overdueStatus` diambil dari sesi PAID terbaru loker
   * itu (`include` dengan `take: 1` — Prisma batch ini dalam 1 query
   * tambahan, bukan N+1 per baris).
   */
  async lokerList(page: number, pageSize: number, status?: LokerStatus, search?: string) {
    const where = {
      status,
      ...(search
        ? {
            OR: [
              { nomorLoker: { contains: search, mode: 'insensitive' as const } },
              { unit: { kodeUnit: { contains: search, mode: 'insensitive' as const } } },
              { unit: { lokasi: { nama: { contains: search, mode: 'insensitive' as const } } } },
            ],
          }
        : {}),
    };

    const [rows, totalItems] = await Promise.all([
      this.prisma.db.loker.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          unit: { include: { lokasi: true, durasiHarga: true } },
          sesiTransaksi: {
            where: { statusBayar: StatusBayar.PAID },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true, waktuSelesai: true, unitDurasiHargaId: true },
          },
        },
      }),
      this.prisma.db.loker.count({ where }),
    ]);

    return {
      data: rows.map((l) => {
        const sesiTerbaru = l.sesiTransaksi[0];
        let overdueStatus = null;
        if (l.status === LokerStatus.TERISI && sesiTerbaru) {
          const tarifPerJam = tarifPerJamTermurah(
            l.unit.durasiHarga
              .filter((d) => d.lokerKategoriId === l.lokerKategoriId)
              .map((d) => ({ harga: Number(d.harga), durasiJam: d.durasiJam, aktif: d.aktif })),
          );
          overdueStatus = computeOverdueStatus(sesiTerbaru.waktuSelesai, tarifPerJam);
        }
        return {
          id: l.id,
          nomorLoker: l.nomorLoker,
          kodeUnit: l.unit.kodeUnit,
          lokasiNama: l.unit.lokasi.nama,
          status: l.status,
          lastActivityAt: sesiTerbaru?.createdAt ?? null,
          overdueStatus,
        };
      }),
      meta: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) },
    };
  }
}
