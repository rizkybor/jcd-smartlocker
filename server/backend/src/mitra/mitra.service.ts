import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMitraDto } from './dto/create-mitra.dto';
import type { UpdateMitraDto } from './dto/update-mitra.dto';

const mitraInclude = { mitraLokasi: { include: { lokasi: true } } } as const;

@Injectable()
export class MitraService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page: number, pageSize: number) {
    const [data, totalItems] = await Promise.all([
      this.prisma.db.mitra.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: mitraInclude,
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

  async findOneOrThrow(id: string) {
    const mitra = await this.prisma.db.mitra.findUnique({
      where: { id },
      include: mitraInclude,
    });
    if (!mitra) throw this.mitraTidakDitemukan();
    return mitra;
  }

  async update(id: string, dto: UpdateMitraDto) {
    const existing = await this.prisma.db.mitra.findUnique({ where: { id } });
    if (!existing) throw this.mitraTidakDitemukan();

    return this.prisma.db.mitra.update({
      where: { id },
      data: { nama: dto.nama, kontak: dto.kontak },
      include: mitraInclude,
    });
  }

  private mitraTidakDitemukan() {
    return new NotFoundException({
      error: { code: 'MITRA_TIDAK_DITEMUKAN', message: 'Mitra tidak ditemukan.' },
    });
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
