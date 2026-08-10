import { Injectable } from '@nestjs/common';
import { StatusApproval, TipeSkema } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { formatUtcInLokasiTimezone } from '../common/timezone.util';
import type { LaporanFilterDto, ExportLaporanDto } from './dto/laporan-filter.dto';

const EXPORT_BUCKET = 'laporan-export';

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

@Injectable()
export class LaporanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  private sesiWhere(filter: LaporanFilterDto) {
    return {
      createdAt: {
        gte: filter.tanggalMulai,
        lte: filter.tanggalSelesai,
      },
      loker: {
        unit: {
          lokasiId: filter.lokasiId,
          lokasi: filter.mitraId
            ? { mitraLokasi: { some: { mitraId: filter.mitraId } } }
            : undefined,
        },
      },
    };
  }

  async transaksi(filter: LaporanFilterDto, page: number, pageSize: number) {
    const where = this.sesiWhere(filter);

    const [rows, totalItems] = await Promise.all([
      this.prisma.db.sesiTransaksi.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          loker: { include: { unit: { include: { lokasi: { include: { mitraLokasi: { include: { mitra: true } } } } } } } },
        },
      }),
      this.prisma.db.sesiTransaksi.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.formatSesiRow(r)),
      meta: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) },
    };
  }

  /**
   * Bagi hasil per mitra (§10) — pakai persentase yang BERLAKU SAAT
   * transaksi terjadi (`berlakuDari`/`berlakuSampai` di
   * MitraLokasiSkemaHistori), bukan persentase yang aktif sekarang.
   * `persentase` = bagian MITRA dari nominal transaksi (asumsi bisnis:
   * "persentase split per mitra" di PRD §10 — belum ada definisi
   * eksplisit yang membedakan dari sisi Smartbox, jadi diperlakukan
   * sebagai porsi mitra; koreksi mudah kalau ternyata sebaliknya, cuma
   * tukar `bagiHasilMitra`/`bagiHasilSmartbox` di bawah).
   */
  async bagiHasil(filter: LaporanFilterDto) {
    const mitraLokasiList = await this.prisma.db.mitraLokasi.findMany({
      where: {
        tipeSkema: TipeSkema.REVENUE_SHARING,
        mitraId: filter.mitraId,
        lokasiId: filter.lokasiId,
      },
      include: {
        mitra: true,
        lokasi: { include: { units: { include: { lokers: true } } } },
        skemaHistori: { where: { statusApproval: StatusApproval.APPROVED } },
      },
    });

    const hasil = [];

    for (const ml of mitraLokasiList) {
      const lokerIds = ml.lokasi.units.flatMap((u) => u.lokers.map((l) => l.id));
      if (lokerIds.length === 0) continue;

      const transaksiList = await this.prisma.db.sesiTransaksi.findMany({
        where: {
          lokerId: { in: lokerIds },
          statusBayar: 'PAID',
          createdAt: { gte: filter.tanggalMulai, lte: filter.tanggalSelesai },
        },
        select: { id: true, nominal: true, createdAt: true },
      });

      let totalNominal = 0;
      let totalBagiHasilMitra = 0;

      for (const t of transaksiList) {
        const histori = ml.skemaHistori.find(
          (h) =>
            h.berlakuDari &&
            h.berlakuDari <= t.createdAt &&
            (h.berlakuSampai === null || h.berlakuSampai > t.createdAt),
        );
        const persentase = histori ? Number(histori.persentase) : Number(ml.persentaseAktif ?? 0);
        const nominal = Number(t.nominal);
        totalNominal += nominal;
        totalBagiHasilMitra += (nominal * persentase) / 100;
      }

      hasil.push({
        mitraId: ml.mitraId,
        mitraNama: ml.mitra.nama,
        lokasiId: ml.lokasiId,
        lokasiNama: ml.lokasi.nama,
        persentaseAktif: ml.persentaseAktif ? Number(ml.persentaseAktif) : null,
        jumlahTransaksi: transaksiList.length,
        totalNominal,
        totalBagiHasilMitra: Math.round(totalBagiHasilMitra),
        totalBagiHasilSmartbox: Math.round(totalNominal - totalBagiHasilMitra),
      });
    }

    return { data: hasil };
  }

  /**
   * Generate CSV SINKRON & upload ke Supabase Storage (§9.1/§9.2) —
   * DEVIASI dari rekomendasi PRD (async via BullMQ, §9.2): Redis belum
   * benar-benar diprovisikan (sama seperti PurgeService, purge/purge.service.ts).
   * Untuk volume laporan MVP, generate sinkron cukup memadai; migrasi ke
   * job queue asli bisa jadi ticket lanjutan begitu Redis tersedia.
   */
  async export(dto: ExportLaporanDto): Promise<{ url: string }> {
    const { jenis, ...filter } = dto;

    let csv: string;
    let filenamePrefix: string;

    if (jenis === 'transaksi') {
      const { data } = await this.transaksi(filter, 1, 10_000);
      csv = toCsv(
        ['ID Transaksi', 'Tanggal', 'Lokasi', 'Mitra', 'Loker', 'Nominal', 'Status Bayar'],
        data.map((r) => [r.idTransaksi, r.tanggal, r.lokasiNama, r.mitraNama, r.nomorLoker, r.nominal, r.statusBayar]),
      );
      filenamePrefix = 'laporan-transaksi';
    } else {
      const { data } = await this.bagiHasil(filter);
      csv = toCsv(
        ['Mitra', 'Lokasi', 'Persentase Aktif', 'Jumlah Transaksi', 'Total Nominal', 'Bagi Hasil Mitra', 'Bagi Hasil Smartbox'],
        data.map((r) => [r.mitraNama, r.lokasiNama, r.persentaseAktif ?? '-', r.jumlahTransaksi, r.totalNominal, r.totalBagiHasilMitra, r.totalBagiHasilSmartbox]),
      );
      filenamePrefix = 'laporan-bagi-hasil';
    }

    const filename = `${filenamePrefix}-${Date.now()}.csv`;
    const { error } = await this.supabase.client.storage
      .from(EXPORT_BUCKET)
      .upload(filename, csv, { contentType: 'text/csv; charset=utf-8' });

    if (error) {
      throw new Error(`Gagal upload laporan ke Supabase Storage: ${error.message}`);
    }

    const { data: signed, error: signError } = await this.supabase.client.storage
      .from(EXPORT_BUCKET)
      .createSignedUrl(filename, 60 * 60); // 1 jam

    if (signError || !signed) {
      throw new Error(`Gagal buat signed URL: ${signError?.message ?? 'unknown error'}`);
    }

    return { url: signed.signedUrl };
  }

  private formatSesiRow(r: {
    id: string;
    idTransaksi: string;
    createdAt: Date;
    nominal: unknown;
    statusBayar: string;
    loker: {
      nomorLoker: string;
      unit: { lokasi: { nama: string; timezone: string; mitraLokasi: { mitra: { nama: string } }[] } };
    };
  }) {
    const lokasi = r.loker.unit.lokasi;
    return {
      id: r.id,
      idTransaksi: r.idTransaksi,
      tanggal: formatUtcInLokasiTimezone(r.createdAt, lokasi.timezone),
      lokasiNama: lokasi.nama,
      mitraNama: lokasi.mitraLokasi.map((ml) => ml.mitra.nama).join(', ') || '-',
      nomorLoker: r.loker.nomorLoker,
      nominal: Number(r.nominal),
      statusBayar: r.statusBayar,
    };
  }
}
