import { ForbiddenException, Injectable } from '@nestjs/common';
import { LokerStatus, StatusApproval, StatusBayar } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { GatewayService } from '../gateway/gateway.service';
import { formatUtcInLokasiTimezone } from '../common/timezone.util';
import type { AuthenticatedMitraUser } from '../auth/types';
import type { MitraLaporanFilterDto } from './dto/mitra-laporan-filter.dto';

const EXPORT_BUCKET = 'laporan-export';

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

/**
 * docs/API-Contract-Smartbox.md §6; docs/PRD-Smartbox.md §5.5. Setiap
 * method di sini WAJIB scoped ke lokasi milik `actor` (via AkunMitraLokasi)
 * lewat WHERE clause eksplisit — RLS Postgres (prisma/sql/constraints_and_rls.sql)
 * cuma berlaku untuk akses langsung Supabase (Realtime), BUKAN untuk query
 * lewat Prisma di sini (backend connect sebagai role `postgres`,
 * bypass RLS) — jadi isolasi harus benar-benar ditegakkan di sini, bukan
 * diasumsikan dari RLS (§9.2).
 */
@Injectable()
export class DashboardMitraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly gatewayService: GatewayService,
  ) {}

  /**
   * `GET /mitra/me` — profil login, dipakai frontend tahu "saya siapa" (§5.5,
   * sama pola dengan ProfileController Dashboard Company). `bolehKelolaMember`
   * (fitur member RFID, di luar cakupan PRD awal) dipakai frontend untuk
   * menampilkan/menyembunyikan menu "Member" — bukan cuma kosmetik, backend
   * (`member.service.ts::assertBolehKelolaMember`) tetap menegakkan ini
   * ulang di setiap endpoint tulis, jangan andalkan sembunyi-UI saja.
   */
  async me(actor: AuthenticatedMitraUser) {
    const mitra = await this.prisma.db.mitra.findUnique({
      where: { id: actor.mitraId },
      select: { nama: true, bolehKelolaMember: true },
    });
    return {
      id: actor.id,
      email: actor.email,
      nama: actor.nama,
      mitraId: actor.mitraId,
      mitraNama: mitra?.nama ?? '',
      bolehKelolaMember: mitra?.bolehKelolaMember ?? false,
    };
  }

  /** Lokasi yang benar-benar boleh diakses akun mitra ini — satu sumber kebenaran untuk semua method di bawah. */
  private async accessibleLokasiIds(actor: AuthenticatedMitraUser): Promise<string[]> {
    const rows = await this.prisma.db.akunMitraLokasi.findMany({
      where: { akunMitraId: actor.id },
      select: { lokasiId: true },
    });
    return rows.map((r) => r.lokasiId);
  }

  /** Validasi `lokasiId` opsional dari query param benar-benar milik mitra ini — cegah IDOR lewat filter manual. */
  private async resolveLokasiScope(actor: AuthenticatedMitraUser, lokasiId?: string): Promise<string[]> {
    const accessible = await this.accessibleLokasiIds(actor);
    if (!lokasiId) return accessible;
    if (!accessible.includes(lokasiId)) {
      throw new ForbiddenException({
        error: { code: 'LOKASI_BUKAN_MILIK_ANDA', message: 'Lokasi ini bukan milik akun mitra Anda.' },
      });
    }
    return [lokasiId];
  }

  async overview(actor: AuthenticatedMitraUser) {
    const lokasiIds = await this.accessibleLokasiIds(actor);
    if (lokasiIds.length === 0) {
      return { jumlahLokasi: 0, jumlahUnit: 0, jumlahLoker: 0, lokerPerStatus: this.emptyLokerPerStatus(), okupansiPersen: 0, pendapatanTotal: 0, unitOnline: 0, unitOffline: 0 };
    }

    const [units, lokerPerStatusRaw, pendapatan] = await Promise.all([
      this.prisma.db.unit.findMany({ where: { lokasiId: { in: lokasiIds } }, select: { kodeUnit: true, id: true } }),
      this.prisma.db.loker.groupBy({
        by: ['status'],
        where: { unit: { lokasiId: { in: lokasiIds } } },
        _count: { _all: true },
      }),
      this.prisma.db.sesiTransaksi.aggregate({
        where: { statusBayar: StatusBayar.PAID, loker: { unit: { lokasiId: { in: lokasiIds } } } },
        _sum: { nominal: true },
      }),
    ]);

    const lokerPerStatus = this.emptyLokerPerStatus();
    for (const row of lokerPerStatusRaw) {
      lokerPerStatus[row.status.toLowerCase() as Lowercase<LokerStatus>] = row._count._all;
    }
    const jumlahLoker = Object.values(lokerPerStatus).reduce((a, b) => a + b, 0);
    const okupansiPersen = jumlahLoker === 0 ? 0 : Math.round((lokerPerStatus.terisi / jumlahLoker) * 1000) / 10;
    const unitOnline = units.filter((u) => this.gatewayService.isOnline(u.kodeUnit)).length;

    return {
      jumlahLokasi: lokasiIds.length,
      jumlahUnit: units.length,
      jumlahLoker,
      lokerPerStatus,
      okupansiPersen,
      pendapatanTotal: Number(pendapatan._sum.nominal ?? 0),
      unitOnline,
      unitOffline: units.length - unitOnline,
    };
  }

  async units(actor: AuthenticatedMitraUser, page: number, pageSize: number) {
    const lokasiIds = await this.accessibleLokasiIds(actor);

    const where = { lokasiId: { in: lokasiIds } };
    const [rows, totalItems] = await Promise.all([
      this.prisma.db.unit.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { lokasi: true, lokers: true, durasiHarga: { where: { aktif: true } } },
      }),
      this.prisma.db.unit.count({ where }),
    ]);

    // unitKey TIDAK PERNAH keluar ke akun mitra (§7.1) — kredensial kiosk.
    const data = rows.map(({ unitKey: _unitKey, ...unit }) => unit);

    return {
      data,
      meta: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) },
    };
  }

  async laporan(actor: AuthenticatedMitraUser, filter: MitraLaporanFilterDto, page: number, pageSize: number) {
    const lokasiIds = await this.resolveLokasiScope(actor, filter.lokasiId);

    const where = {
      createdAt: { gte: filter.tanggalMulai, lte: filter.tanggalSelesai },
      loker: { unit: { lokasiId: { in: lokasiIds } } },
    };

    const [rows, totalItems, bagiHasil] = await Promise.all([
      this.prisma.db.sesiTransaksi.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { loker: { include: { unit: { include: { lokasi: true } } } } },
      }),
      this.prisma.db.sesiTransaksi.count({ where }),
      this.hitungBagiHasil(actor, lokasiIds, filter),
    ]);

    return {
      data: rows.map((r) => this.formatSesiRow(r)),
      meta: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) },
      bagiHasil,
    };
  }

  /**
   * Ringkasan bagi hasil milik mitra ini sendiri — logic sama dengan
   * LaporanService.bagiHasil() (Dashboard Company) tapi di-scope ketat ke
   * `actor.mitraId`, bukan menerima mitraId dari caller.
   */
  private async hitungBagiHasil(actor: AuthenticatedMitraUser, lokasiIds: string[], filter: MitraLaporanFilterDto) {
    const mitraLokasiList = await this.prisma.db.mitraLokasi.findMany({
      where: { mitraId: actor.mitraId, lokasiId: { in: lokasiIds } },
      include: {
        lokasi: { include: { units: { include: { lokers: true } } } },
        skemaHistori: { where: { statusApproval: StatusApproval.APPROVED } },
      },
    });

    let totalNominal = 0;
    let totalBagiHasilMitra = 0;
    let jumlahTransaksi = 0;

    for (const ml of mitraLokasiList) {
      const lokerIds = ml.lokasi.units.flatMap((u) => u.lokers.map((l) => l.id));
      if (lokerIds.length === 0) continue;

      const transaksiList = await this.prisma.db.sesiTransaksi.findMany({
        where: {
          lokerId: { in: lokerIds },
          statusBayar: StatusBayar.PAID,
          createdAt: { gte: filter.tanggalMulai, lte: filter.tanggalSelesai },
        },
        select: { nominal: true, createdAt: true },
      });

      for (const t of transaksiList) {
        const histori = ml.skemaHistori.find(
          (h) => h.berlakuDari && h.berlakuDari <= t.createdAt && (h.berlakuSampai === null || h.berlakuSampai > t.createdAt),
        );
        const persentase = histori ? Number(histori.persentase) : Number(ml.persentaseAktif ?? 0);
        const nominal = Number(t.nominal);
        totalNominal += nominal;
        totalBagiHasilMitra += (nominal * persentase) / 100;
        jumlahTransaksi += 1;
      }
    }

    return {
      jumlahTransaksi,
      totalNominal,
      totalBagiHasilMitra: Math.round(totalBagiHasilMitra),
    };
  }

  /** Ekspor CSV — sinkron, deviasi sama seperti LaporanService (Dashboard Company), lihat catatan di sana. */
  async export(actor: AuthenticatedMitraUser, filter: MitraLaporanFilterDto): Promise<{ url: string }> {
    const { data } = await this.laporan(actor, filter, 1, 10_000);

    const csv = toCsv(
      ['ID Transaksi', 'Tanggal', 'Lokasi', 'Loker', 'Nominal', 'Status Bayar'],
      data.map((r) => [r.idTransaksi, r.tanggal, r.lokasiNama, r.nomorLoker, r.nominal, r.statusBayar]),
    );

    const filename = `laporan-mitra-${actor.mitraId}-${Date.now()}.csv`;
    const { error } = await this.supabase.client.storage
      .from(EXPORT_BUCKET)
      .upload(filename, csv, { contentType: 'text/csv; charset=utf-8' });
    if (error) throw new Error(`Gagal upload laporan ke Supabase Storage: ${error.message}`);

    const { data: signed, error: signError } = await this.supabase.client.storage
      .from(EXPORT_BUCKET)
      .createSignedUrl(filename, 60 * 60);
    if (signError || !signed) throw new Error(`Gagal buat signed URL: ${signError?.message ?? 'unknown error'}`);

    return { url: signed.signedUrl };
  }

  private emptyLokerPerStatus(): Record<Lowercase<LokerStatus>, number> {
    return { tersedia: 0, terisi: 0, maintenance: 0, offline: 0, nonaktif: 0 };
  }

  private formatSesiRow(r: {
    id: string;
    idTransaksi: string;
    createdAt: Date;
    nominal: unknown;
    statusBayar: string;
    loker: { nomorLoker: string; unit: { lokasi: { nama: string; timezone: string } } };
  }) {
    const lokasi = r.loker.unit.lokasi;
    return {
      id: r.id,
      idTransaksi: r.idTransaksi,
      tanggal: formatUtcInLokasiTimezone(r.createdAt, lokasi.timezone),
      lokasiNama: lokasi.nama,
      nomorLoker: r.loker.nomorLoker,
      nominal: Number(r.nominal),
      statusBayar: r.statusBayar,
    };
  }
}
