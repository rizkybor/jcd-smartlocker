import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateLokasiDto } from './dto/create-lokasi.dto';

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
      },
    });
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
}
