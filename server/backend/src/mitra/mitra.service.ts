import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMitraDto } from './dto/create-mitra.dto';

@Injectable()
export class MitraService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page: number, pageSize: number) {
    const [data, totalItems] = await Promise.all([
      this.prisma.db.mitra.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { mitraLokasi: true },
      }),
      this.prisma.db.mitra.count(),
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

  /**
   * Buat Mitra + relasi MitraLokasi sekaligus (§10, API Contract §5.2).
   * `persentaseAktif` sengaja tetap null di sini bahkan untuk
   * REVENUE_SHARING — harus lewat alur ajukan/approve (SkemaHistoriService)
   * supaya tercatat riwayatnya, tidak ada persentase "siluman" yang
   * langsung aktif tanpa approval Manager.
   */
  async create(dto: CreateMitraDto) {
    const lokasi = await this.prisma.db.lokasi.findUnique({ where: { id: dto.lokasiId } });
    if (!lokasi) {
      throw new NotFoundException('Lokasi tidak ditemukan.');
    }

    return this.prisma.db.mitra.create({
      data: {
        nama: dto.nama,
        kontak: dto.kontak,
        mitraLokasi: {
          create: {
            lokasiId: dto.lokasiId,
            tipeSkema: dto.tipeSkema,
          },
        },
      },
      include: { mitraLokasi: true },
    });
  }

  async softDelete(id: string) {
    return this.prisma.softDelete('mitra', id);
  }
}
