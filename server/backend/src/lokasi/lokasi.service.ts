import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateLokasiDto } from './dto/create-lokasi.dto';
import type { UpdateLokasiDto } from './dto/update-lokasi.dto';
import type { LokasiPilihanDto } from './dto/wilayah.dto';

@Injectable()
export class LokasiService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page: number, pageSize: number) {
    const [data, totalItems] = await Promise.all([
      this.prisma.db.lokasi.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
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
