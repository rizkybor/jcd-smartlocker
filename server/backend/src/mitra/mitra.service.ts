import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { LokasiService } from '../lokasi/lokasi.service';
import type { CreateMitraDto } from './dto/create-mitra.dto';
import type { UpdateMitraDto } from './dto/update-mitra.dto';

const mitraInclude = { mitraLokasi: { include: { lokasi: true } } } as const;

@Injectable()
export class MitraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly lokasiService: LokasiService,
  ) {}

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
      data: { nama: dto.nama, kontak: dto.kontak, bolehKelolaMember: dto.bolehKelolaMember },
      include: mitraInclude,
    });
  }

  private mitraTidakDitemukan() {
    return new NotFoundException({
      error: { code: 'MITRA_TIDAK_DITEMUKAN', message: 'Mitra tidak ditemukan.' },
    });
  }

  /**
   * Buat Mitra + relasi MitraLokasi + akun login Mitra sekaligus (§10, API
   * Contract §5.2; fitur akun-sekaligus & lokasi-inline di luar cakupan PRD
   * awal — permintaan bisnis langsung).
   *
   * `persentaseAktif` sengaja tetap null di sini bahkan untuk
   * REVENUE_SHARING — harus lewat alur ajukan/approve (SkemaHistoriService)
   * supaya tercatat riwayatnya, tidak ada persentase "siluman" yang
   * langsung aktif tanpa approval Manager.
   *
   * Sengaja TIDAK dibungkus `$transaction` — provisioning Supabase Auth
   * (panggilan API eksternal) tidak bisa ikut rollback transaksi Postgres.
   * Kalau gagal di tengah, baris yang sudah dibuat tetap ada (Lokasi/Mitra)
   * — dampaknya minor (data tambahan yang tidak terpakai), jauh lebih
   * aman daripada mencoba "rollback" panggilan API pihak ketiga yang sudah
   * terlanjur sukses.
   */
  async create(dto: CreateMitraDto) {
    const lokasi = await this.lokasiService.resolveOrCreateLokasi(dto);

    const emailSudahDipakai = await this.prisma.db.akunMitra.findUnique({ where: { email: dto.akunMitra.email } });
    if (emailSudahDipakai) {
      throw new ConflictException({
        error: { code: 'EMAIL_SUDAH_DIPAKAI', message: 'Email ini sudah dipakai akun mitra lain.' },
      });
    }

    const mitra = await this.prisma.db.mitra.create({
      data: {
        nama: dto.nama,
        kontak: dto.kontak,
        mitraLokasi: {
          create: {
            lokasiId: lokasi.id,
            tipeSkema: dto.tipeSkema,
          },
        },
      },
      include: { mitraLokasi: true },
    });

    const authUser = await this.supabase.createAuthUserWithPassword(dto.akunMitra.email, dto.akunMitra.password);

    await this.prisma.db.akunMitra.create({
      data: {
        mitraId: mitra.id,
        supabaseAuthUid: authUser.id,
        nama: dto.akunMitra.nama,
        email: dto.akunMitra.email,
        aksesLokasi: { create: { lokasiId: lokasi.id } },
      },
    });

    return this.findOneOrThrow(mitra.id);
  }

  /**
   * Hapus (soft-delete) Mitra — HANYA kalau tidak ada Unit aktif yang
   * masih menunjuk ke mitra ini sebagai owner (di luar cakupan PRD awal,
   * permintaan bisnis langsung, sama alasannya seperti
   * `LokasiService.remove()`) — mencegah `Unit.mitraId` jadi "yatim",
   * menunjuk ke Mitra yang sudah dihapus.
   */
  async softDelete(id: string) {
    const existing = await this.prisma.db.mitra.findUnique({ where: { id } });
    if (!existing) throw this.mitraTidakDitemukan();

    const jumlahUnit = await this.prisma.db.unit.count({ where: { mitraId: id, deletedAt: null } });
    if (jumlahUnit > 0) {
      throw new ConflictException({
        error: {
          code: 'MITRA_MASIH_PUNYA_UNIT',
          message: `Mitra ini masih memiliki ${jumlahUnit} unit aktif — pindahkan/nonaktifkan unit itu dulu sebelum menghapus mitra.`,
        },
      });
    }

    return this.prisma.softDelete('mitra', id);
  }
}
