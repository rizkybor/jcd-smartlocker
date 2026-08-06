import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LogKategori, StatusApproval, TipeSkema } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import type { AuthenticatedInternalUser } from '../auth/types';
import type { AjukanSkemaDto } from './dto/ajukan-skema.dto';

/**
 * Alur ajukan & approve persentase revenue sharing (docs/PRD-Smartbox.md
 * §10, §12 poin 2; docs/API-Contract-Smartbox.md §5.2).
 *
 * PENTING (klarifikasi user, bukan asumsi awal): ini BUKAN mitra yang
 * mengajukan apa pun — mitra sama sekali tidak terlibat. "Ajukan" di sini
 * artinya **Super Admin menentukan/input persentase** dari Dashboard
 * Company, lalu **Manager yang approve** sebelum berlaku. Istilah "ajukan"
 * dipakai karena strukturnya tetap "baris baru berstatus pending sampai
 * disetujui" (§10 — perlu riwayat/versi, bukan overwrite), bukan karena ada
 * pihak eksternal yang benar-benar mengajukan permintaan.
 */
@Injectable()
export class SkemaHistoriService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async listHistori(mitraLokasiId: string) {
    const mitraLokasi = await this.prisma.db.mitraLokasi.findUnique({
      where: { id: mitraLokasiId },
    });
    if (!mitraLokasi) {
      throw new NotFoundException('Relasi Mitra-Lokasi tidak ditemukan.');
    }

    return this.prisma.db.mitraLokasiSkemaHistori.findMany({
      where: { mitraLokasiId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Super Admin menentukan persentase baru — selalu jadi baris PENDING
   * baru, tidak pernah langsung aktif (§10).
   */
  async ajukan(mitraLokasiId: string, dto: AjukanSkemaDto, actor: AuthenticatedInternalUser) {
    const mitraLokasi = await this.prisma.db.mitraLokasi.findUnique({
      where: { id: mitraLokasiId },
    });
    if (!mitraLokasi) {
      throw new NotFoundException('Relasi Mitra-Lokasi tidak ditemukan.');
    }
    if (mitraLokasi.tipeSkema !== TipeSkema.REVENUE_SHARING) {
      throw new BadRequestException({
        error: {
          code: 'BUKAN_SKEMA_REVENUE_SHARING',
          message:
            'Persentase hanya berlaku untuk mitra dengan tipe skema Revenue Sharing, bukan Fixed Rental.',
        },
      });
    }

    const histori = await this.prisma.db.mitraLokasiSkemaHistori.create({
      data: {
        mitraLokasiId,
        persentase: dto.persentase,
        statusApproval: StatusApproval.PENDING,
        diajukanOleh: actor.id,
      },
    });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.KEAMANAN,
      aksi: 'tentukan_persentase_revenue_sharing',
      entitas: 'mitra_lokasi_skema_histori',
      entitasId: histori.id,
      detail: { mitraLokasiId, persentase: dto.persentase },
    });

    return histori;
  }

  /**
   * HANYA role MANAGER — ditegakkan di guard controller (§7, §10), bukan
   * di sini, tapi dicek ulang di sini sebagai pertahanan berlapis kalau
   * service ini suatu saat dipanggil dari tempat lain.
   */
  async approve(historiId: string, actor: AuthenticatedInternalUser) {
    const target = await this.prisma.db.mitraLokasiSkemaHistori.findUnique({
      where: { id: historiId },
    });
    if (!target) {
      throw new NotFoundException('Pengajuan persentase tidak ditemukan.');
    }
    if (target.statusApproval !== StatusApproval.PENDING) {
      throw new BadRequestException({
        error: {
          code: 'SUDAH_DIPROSES',
          message: `Pengajuan ini sudah berstatus ${target.statusApproval}, tidak bisa diproses ulang.`,
        },
      });
    }

    const now = new Date();

    const [, approved] = await this.prisma.db.$transaction([
      // Tutup baris yang sebelumnya aktif (kalau ada) — riwayat tetap utuh
      // (append-only, §7.1), cuma ditandai berlakuSampai.
      this.prisma.db.mitraLokasiSkemaHistori.updateMany({
        where: {
          mitraLokasiId: target.mitraLokasiId,
          statusApproval: StatusApproval.APPROVED,
          berlakuSampai: null,
        },
        data: { berlakuSampai: now },
      }),
      this.prisma.db.mitraLokasiSkemaHistori.update({
        where: { id: historiId },
        data: {
          statusApproval: StatusApproval.APPROVED,
          disetujuiOleh: actor.id,
          disetujuiAt: now,
          berlakuDari: now,
        },
      }),
      this.prisma.db.mitraLokasi.update({
        where: { id: target.mitraLokasiId },
        data: { persentaseAktif: target.persentase },
      }),
    ]);

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.KEAMANAN,
      aksi: 'approve_persentase_revenue_sharing',
      entitas: 'mitra_lokasi_skema_histori',
      entitasId: historiId,
      detail: { mitraLokasiId: target.mitraLokasiId, persentase: target.persentase },
    });

    return approved;
  }

  async reject(historiId: string, actor: AuthenticatedInternalUser) {
    const target = await this.prisma.db.mitraLokasiSkemaHistori.findUnique({
      where: { id: historiId },
    });
    if (!target) {
      throw new NotFoundException('Pengajuan persentase tidak ditemukan.');
    }
    if (target.statusApproval !== StatusApproval.PENDING) {
      throw new BadRequestException({
        error: {
          code: 'SUDAH_DIPROSES',
          message: `Pengajuan ini sudah berstatus ${target.statusApproval}, tidak bisa diproses ulang.`,
        },
      });
    }

    const rejected = await this.prisma.db.mitraLokasiSkemaHistori.update({
      where: { id: historiId },
      data: {
        statusApproval: StatusApproval.REJECTED,
        disetujuiOleh: actor.id,
        disetujuiAt: new Date(),
      },
    });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.KEAMANAN,
      aksi: 'reject_persentase_revenue_sharing',
      entitas: 'mitra_lokasi_skema_histori',
      entitasId: historiId,
      detail: { mitraLokasiId: target.mitraLokasiId, persentase: target.persentase },
    });

    return rejected;
  }
}
