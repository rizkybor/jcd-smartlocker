import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Unit } from '@prisma/client';
import { LokerStatus, StatusBayar } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import type { EnvConfig } from '../config/env.validation';
import type { AmbilMulaiDto } from './dto/ambil-mulai.dto';
import type { VerifikasiOtpDto } from './dto/verifikasi-otp.dto';

const OTP_EXPIRY_MINUTES = 5;

/**
 * Alur ambil barang (docs/PRD-Smartbox.md §5.2; docs/API-Contract-Smartbox.md
 * §2). Loker.status TERISI adalah sumber kebenaran "sesi masih aktif/belum
 * diambil" — tidak ada kolom "sudah diambil" terpisah di SesiTransaksi,
 * konsisten dengan model yang sudah ada (bukukan financial record tetap
 * append-only, status operasional ada di Loker).
 */
@Injectable()
export class KioskAmbilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  /**
   * Cari sesi aktif (sudah bayar, pintu pernah dibuka saat sewa, loker
   * masih TERISI, di unit yang sama dengan kiosk ini) yang cocok dengan
   * nomorHp. Loker fisik cuma bisa dibuka dari kiosk/unit yang sama.
   */
  async mulaiAmbil(unit: Unit, dto: AmbilMulaiDto) {
    const sesi = await this.prisma.db.sesiTransaksi.findFirst({
      where: {
        nomorHp: dto.nomorHp,
        statusBayar: StatusBayar.PAID,
        waktuMulai: { not: null },
        loker: { status: LokerStatus.TERISI, unitId: unit.id },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!sesi) {
      throw new NotFoundException({
        error: {
          code: 'SESI_TIDAK_DITEMUKAN',
          message: 'Tidak ada sesi aktif untuk nomor HP ini di unit ini.',
        },
      });
    }

    return { id: sesi.id };
  }

  async kirimOtp(sesiId: string) {
    const sesi = await this.getSesiAktifOrThrow(sesiId);

    const destination = this.pilihDestinasiOtp(sesi);
    const code = this.otpService.generateCode();
    const hash = this.otpService.hashCode(code);

    await this.prisma.db.sesiTransaksi.update({
      where: { id: sesi.id },
      data: { kodeOtpAmbilHash: hash, otpVerifiedAt: null },
    });

    try {
      await this.otpService.sendCode(destination, code, OTP_EXPIRY_MINUTES);
    } catch (_err) {
      // Kegagalan provider OTP (mis. Brevo down/ditolak) HARUS punya pesan
      // actionable di kiosk (§5.6, §13.1), bukan 500 generik tanpa envelope
      // { error } — ditemukan langsung saat verifikasi Epic 4 (Brevo 401
      // IP tidak dikenal di lingkungan dev ini).
      throw new ConflictException({
        error: {
          code: 'OTP_GAGAL_KIRIM',
          message: 'Gagal mengirim kode OTP. Silakan coba lagi.',
        },
      });
    }

    return { terkirim: true };
  }

  async verifikasiOtp(dto: VerifikasiOtpDto) {
    const sesi = await this.getSesiAktifOrThrow(dto.sesiId);

    if (!sesi.kodeOtpAmbilHash) {
      throw new ConflictException({
        error: {
          code: 'OTP_BELUM_DIKIRIM',
          message: 'Belum ada kode OTP yang dikirim untuk sesi ini.',
        },
      });
    }

    const valid = this.otpService.verifyCode(dto.kode, sesi.kodeOtpAmbilHash);
    if (!valid) {
      throw new UnauthorizedException({
        error: { code: 'KODE_OTP_SALAH', message: 'Kode OTP salah atau sudah kedaluwarsa.' },
      });
    }

    await this.prisma.db.sesiTransaksi.update({
      where: { id: sesi.id },
      data: { otpVerifiedAt: new Date() },
    });

    return { valid: true };
  }

  /**
   * TODO (Epic 5, Gateway Hardware/MQTT — belum dibangun): sama seperti
   * KioskSewaService.bukaPintu(), endpoint ini seharusnya publish perintah
   * `buka_pintu` ke MQTT dan menunggu ack sensor sebelum loker ditandai
   * TERSEDIA lagi. Untuk sekarang langsung ditandai selesai di database
   * tanpa konfirmasi hardware sungguhan.
   */
  async bukaPintu(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({
      where: { id: sesiId },
      include: { loker: true },
    });
    if (!sesi) throw this.sesiTidakDitemukan();

    if (!sesi.otpVerifiedAt) {
      throw new ConflictException({
        error: {
          code: 'OTP_BELUM_TERVERIFIKASI',
          message: 'Verifikasi OTP dulu sebelum membuka pintu.',
        },
      });
    }

    if (sesi.loker.status === LokerStatus.TERSEDIA) {
      // Idempotent — sudah pernah dibuka/selesai sebelumnya.
      return sesi;
    }

    await this.prisma.db.loker.update({
      where: { id: sesi.lokerId },
      data: { status: LokerStatus.TERSEDIA },
    });

    return sesi;
  }

  /** Channel aktif menentukan field mana yang jadi tujuan OTP (§8, SMB-207). */
  private pilihDestinasiOtp(sesi: { nomorHp: string | null; email: string | null }): string {
    const channelAktif = this.config.get('OTP_CHANNEL_ACTIVE', { infer: true });
    const destination = channelAktif === 'whatsapp' ? sesi.nomorHp : sesi.email;

    if (!destination) {
      throw new ConflictException({
        error: {
          code: 'TUJUAN_OTP_TIDAK_ADA',
          message: `Sesi ini tidak punya ${channelAktif === 'whatsapp' ? 'nomor HP' : 'email'} untuk kirim OTP.`,
        },
      });
    }

    return destination;
  }

  private async getSesiAktifOrThrow(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findFirst({
      where: {
        id: sesiId,
        statusBayar: StatusBayar.PAID,
        loker: { status: LokerStatus.TERISI },
      },
    });
    if (!sesi) throw this.sesiTidakDitemukan();
    return sesi;
  }

  private sesiTidakDitemukan() {
    return new NotFoundException({
      error: { code: 'SESI_TIDAK_DITEMUKAN', message: 'Sesi transaksi tidak ditemukan.' },
    });
  }
}
