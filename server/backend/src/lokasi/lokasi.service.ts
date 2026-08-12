import { ConflictException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateLokasiDto } from './dto/create-lokasi.dto';
import type { UpdateLokasiDto } from './dto/update-lokasi.dto';
import type { LokasiPilihanDto } from './dto/wilayah.dto';

/**
 * Sertakan jumlah pemakaian (di luar cakupan PRD awal) — Super Admin perlu
 * tahu "lokasi ini masih dipakai atau tidak" sebelum mencoba hapus. Filter
 * `deletedAt: null` WAJIB eksplisit di sini — soft-delete.extension.ts
 * cuma otomatis memfilter panggilan top-level (`unit.findMany()` dst.),
 * BUKAN nested `_count` seperti ini, jadi loker/unit yang sudah
 * dinonaktifkan tidak boleh ikut dihitung sebagai "masih dipakai".
 */
const lokasiListInclude = {
  _count: {
    select: {
      units: { where: { deletedAt: null } },
      mitraLokasi: { where: { deletedAt: null } },
    },
  },
} as const;

@Injectable()
export class LokasiService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page: number, pageSize: number) {
    const [data, totalItems] = await Promise.all([
      this.prisma.db.lokasi.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: lokasiListInclude,
      }),
      this.prisma.db.lokasi.count(),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  }

  async create(dto: CreateLokasiDto) {
    this.assertValidTimezone(dto.timezone);

    return this.prisma.db.lokasi.create({
      data: {
        nama: dto.nama,
        alamat: dto.alamat,
        timezone: dto.timezone,
        ...dto.wilayah,
      },
    });
  }

  async update(id: string, dto: UpdateLokasiDto) {
    const existing = await this.prisma.db.lokasi.findUnique({ where: { id } });
    if (!existing) throw this.lokasiTidakDitemukan();

    if (dto.timezone) this.assertValidTimezone(dto.timezone);

    return this.prisma.db.lokasi.update({
      where: { id },
      data: {
        nama: dto.nama,
        alamat: dto.alamat,
        timezone: dto.timezone,
        ...dto.wilayah,
      },
    });
  }

  /**
   * Hapus (soft-delete) Lokasi — HANYA kalau tidak dipakai siapa pun (di
   * luar cakupan PRD awal, permintaan bisnis langsung). "Dipakai" =
   * punya Unit aktif ATAU baris MitraLokasi aktif yang menunjuk ke sini —
   * kalau salah satu masih ada, tolak dengan pesan jelas (bukan cascade
   * diam-diam yang bisa mematahkan riwayat transaksi/revenue-sharing).
   */
  async remove(id: string) {
    const existing = await this.prisma.db.lokasi.findUnique({ where: { id } });
    if (!existing) throw this.lokasiTidakDitemukan();

    const [jumlahUnit, jumlahMitraLokasi] = await Promise.all([
      this.prisma.db.unit.count({ where: { lokasiId: id, deletedAt: null } }),
      this.prisma.db.mitraLokasi.count({ where: { lokasiId: id, deletedAt: null } }),
    ]);

    if (jumlahUnit > 0 || jumlahMitraLokasi > 0) {
      throw new ConflictException({
        error: {
          code: 'LOKASI_MASIH_DIPAKAI',
          message: `Lokasi ini masih dipakai oleh ${jumlahUnit} unit dan ${jumlahMitraLokasi} relasi mitra — nonaktifkan/pindahkan itu dulu sebelum menghapus lokasi.`,
        },
      });
    }

    await this.prisma.softDelete('lokasi', id);
    return { deleted: true };
  }

  /**
   * Dipakai `MitraService`/`UnitService` — mitra & unit sama-sama boleh
   * REUSE Lokasi existing atau bikin baru inline lewat wilayah picker
   * (§ konfirmasi bisnis, di luar cakupan PRD awal). Satu sumber logic
   * supaya perilakunya konsisten di kedua alur.
   */
  async resolveOrCreateLokasi(pilihan: LokasiPilihanDto) {
    if (pilihan.lokasiId) {
      const lokasi = await this.prisma.db.lokasi.findUnique({ where: { id: pilihan.lokasiId } });
      if (!lokasi) throw this.lokasiTidakDitemukan();
      return lokasi;
    }

    // `lokasiPilihanSchema` sudah memastikan salah satu dari keduanya wajib ada.
    return this.create(pilihan.lokasiBaru!);
  }

  /**
   * `Intl.supportedValuesOf('timeZone')` — cek nama zona benar-benar valid
   * (§7.2), bukan cuma cocok pola regex "Xxx/Yyy".
   */
  private assertValidTimezone(timezone: string) {
    const known = Intl.supportedValuesOf('timeZone');
    if (!known.includes(timezone)) {
      throw new BadRequestException({
        error: {
          code: 'TIMEZONE_TIDAK_DIKENAL',
          message: `"${timezone}" bukan nama timezone IANA yang valid, mis. "Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura".`,
        },
      });
    }
  }

  private lokasiTidakDitemukan() {
    return new NotFoundException({
      error: { code: 'LOKASI_TIDAK_DITEMUKAN', message: 'Lokasi tidak ditemukan.' },
    });
  }
}
