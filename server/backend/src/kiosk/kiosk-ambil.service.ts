import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Unit } from '@prisma/client';
import { LokerStatus, StatusBayar } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { MqttClientService } from '../gateway/mqtt-client.service';
import { PAYMENT_PROVIDER } from '../payment/payment-provider.interface';
import type { PaymentProvider } from '../payment/payment-provider.interface';
import { computeOverdueStatus, tarifPerJamTermurah } from '../common/overdue.util';
import { generateIdTransaksi } from '../common/id-transaksi.util';
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
 *
 * Overdue/denda/suspend (fitur tambahan di luar PRD awal, permintaan bisnis
 * langsung): kalau `waktuSelesai` sudah lewat tapi belum 24 jam, penyewa
 * WAJIB bayar denda kekurangan (SesiDenda) dulu sebelum bisa kirim/verifikasi
 * OTP/buka pintu — ditegakkan di `getSesiAktifOrThrow()` supaya SEMUA langkah
 * alur ambil konsisten menolak sampai lunas. Kalau sudah >=24 jam, loker
 * DISUSPEND — kiosk tidak lagi menawarkan jalur bayar sendiri sama sekali,
 * cuma Super Admin yang bisa buka (lihat unit.service.ts).
 */
@Injectable()
export class KioskAmbilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly mqttClient: MqttClientService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  /**
   * Cari sesi aktif (sudah bayar, pintu pernah dibuka saat sewa, loker
   * masih TERISI, di unit yang sama dengan kiosk ini) yang cocok dengan
   * nomorHp, lalu sertakan status overdue/denda/suspend supaya kiosk bisa
   * langsung mengarahkan ke layar yang tepat (normal / bayar denda /
   * suspend) tanpa panggilan tambahan.
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

    const overdue = await this.overdueStatusOf(sesi.id);
    return { id: sesi.id, ...overdue };
  }

  /**
   * Fitur member RFID (di luar cakupan PRD awal): dipakai `KioskRfidService`
   * saat tap kartu — cek apakah member ini sedang punya sesi aktif di unit
   * ini (berarti tap-nya adalah AMBIL barang), sebelum menyimpulkan tap
   * itu SEWA baru. Return `null` (bukan throw) kalau tidak ada, supaya
   * caller bisa cabang alur dengan bersih.
   */
  async cariSesiAktifMember(unit: Unit, memberId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findFirst({
      where: {
        memberId,
        statusBayar: StatusBayar.PAID,
        waktuMulai: { not: null },
        loker: { status: LokerStatus.TERISI, unitId: unit.id },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!sesi) return null;

    const overdue = await this.overdueStatusOf(sesi.id);
    return { id: sesi.id, ...overdue };
  }

  /** Denda kekurangan (jam overdue x tarif per-jam termurah KATEGORI loker sesi ini) — lihat overdue.util.ts. */
  private async overdueStatusOf(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUniqueOrThrow({
      where: { id: sesiId },
      include: { unitDurasiHarga: { include: { lokerKategori: { include: { durasiHarga: true } } } } },
    });
    const tarifPerJam = tarifPerJamTermurah(
      sesi.unitDurasiHarga.lokerKategori.durasiHarga.map((d) => ({ harga: Number(d.harga), durasiJam: d.durasiJam, aktif: d.aktif })),
    );
    return computeOverdueStatus(sesi.waktuSelesai, tarifPerJam);
  }

  /** Denda sudah lunas kalau ADA baris SesiDenda berstatus PAID untuk sesi ini. */
  private async dendaSudahLunas(sesiId: string): Promise<boolean> {
    const paid = await this.prisma.db.sesiDenda.findFirst({
      where: { sesiTransaksiId: sesiId, statusBayar: StatusBayar.PAID },
      select: { id: true },
    });
    return !!paid;
  }

  /** `POST /kiosk/ambil/:sesiId/bayar-denda` — buat charge QRIS untuk denda kekurangan. */
  async bayarDenda(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({ where: { id: sesiId } });
    if (!sesi) throw this.sesiTidakDitemukan();

    const overdue = await this.overdueStatusOf(sesiId);
    if (!overdue.overdue) {
      throw new ConflictException({
        error: { code: 'BELUM_OVERDUE', message: 'Sesi ini belum melewati waktu selesai, tidak ada denda.' },
      });
    }
    if (overdue.suspended) {
      throw new ConflictException({
        error: {
          code: 'LOKER_DISUSPEND',
          message: 'Terlambat lebih dari 24 jam — loker disuspend, hubungi Super Admin untuk membuka.',
        },
      });
    }
    if (await this.dendaSudahLunas(sesiId)) {
      throw new ConflictException({
        error: { code: 'DENDA_SUDAH_LUNAS', message: 'Denda untuk sesi ini sudah lunas.' },
      });
    }

    const idTransaksi = generateIdTransaksi();
    const charge = await this.paymentProvider.createQrisCharge({
      idTransaksi,
      nominal: overdue.dendaNominal,
    });

    await this.prisma.db.sesiDenda.create({
      data: {
        sesiTransaksiId: sesiId,
        jamTerlambat: overdue.jamTerlambat,
        nominal: overdue.dendaNominal,
        paymentProvider: this.paymentProvider.name,
        paymentProviderRefId: charge.providerRefId,
        idTransaksi,
      },
    });

    return { qrString: charge.qrString, expiredAt: charge.expiredAt, nominal: overdue.dendaNominal, jamTerlambat: overdue.jamTerlambat };
  }

  /** `GET /kiosk/ambil/:sesiId/status-denda` — status charge denda TERBARU untuk sesi ini. */
  async statusDenda(sesiId: string) {
    const terbaru = await this.prisma.db.sesiDenda.findFirst({
      where: { sesiTransaksiId: sesiId },
      orderBy: { createdAt: 'desc' },
      select: { statusBayar: true },
    });
    if (!terbaru) {
      throw new NotFoundException({
        error: { code: 'DENDA_BELUM_DIBUAT', message: 'Belum ada tagihan denda untuk sesi ini.' },
      });
    }
    return { statusBayar: terbaru.statusBayar };
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
   * TODO (Epic 5 sebagian — SMB-502-505/510 masih blocked hardware, PRD
   * §12 poin 1): sama seperti KioskSewaService.bukaPintu(), perintah
   * sudah di-publish ke MQTT tapi fire-and-forget, TIDAK menunggu ack
   * sensor sebelum loker ditandai TERSEDIA lagi.
   */
  async bukaPintu(sesiId: string) {
    const sesi = await this.getSesiAktifOrThrow(sesiId);

    if (!sesi.otpVerifiedAt) {
      throw new ConflictException({
        error: {
          code: 'OTP_BELUM_TERVERIFIKASI',
          message: 'Verifikasi OTP dulu sebelum membuka pintu.',
        },
      });
    }

    return this.bukaPintuInternal(sesi);
  }

  /**
   * Fitur member RFID (di luar cakupan PRD awal): member "umum" ambil
   * barang lewat TAP ULANG kartu di kiosk, bukan OTP — tap itu sendiri
   * SUDAH jadi identifikasi + otorisasi (fisik kartu = faktor auth-nya),
   * jadi TIDAK ada pengecekan `otpVerifiedAt` di sini. Aturan denda/suspend
   * tetap berlaku sama seperti alur OTP biasa (`getSesiAktifOrThrow`).
   */
  async bukaPintuViaRfid(sesiId: string) {
    const sesi = await this.getSesiAktifOrThrow(sesiId);
    return this.bukaPintuInternal(sesi);
  }

  private async bukaPintuInternal(sesi: Awaited<ReturnType<KioskAmbilService['getSesiAktifOrThrow']>>) {
    if (sesi.loker.status === LokerStatus.TERSEDIA) {
      // Idempotent — sudah pernah dibuka/selesai sebelumnya.
      return sesi;
    }

    this.mqttClient.publishPerintahBukaPintu(sesi.loker.unit.kodeUnit, sesi.loker.nomorLoker, sesi.id);

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

  /**
   * Satu sumber kebenaran dipakai kirimOtp/verifikasiOtp/bukaPintu — SEMUA
   * langkah alur ambil menolak konsisten kalau loker disuspend atau denda
   * belum lunas, bukan cuma ditolak di satu titik lalu langkah lain
   * kebobolan lewat urutan panggilan yang salah.
   */
  private async getSesiAktifOrThrow(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findFirst({
      where: {
        id: sesiId,
        statusBayar: StatusBayar.PAID,
        loker: { status: LokerStatus.TERISI },
      },
      include: {
        unitDurasiHarga: { include: { lokerKategori: { include: { durasiHarga: true } } } },
        loker: { include: { unit: true } },
      },
    });
    if (!sesi) throw this.sesiTidakDitemukan();

    const tarifPerJam = tarifPerJamTermurah(
      sesi.unitDurasiHarga.lokerKategori.durasiHarga.map((d) => ({ harga: Number(d.harga), durasiJam: d.durasiJam, aktif: d.aktif })),
    );
    const overdue = computeOverdueStatus(sesi.waktuSelesai, tarifPerJam);

    if (overdue.suspended) {
      throw new ConflictException({
        error: {
          code: 'LOKER_DISUSPEND',
          message: 'Terlambat lebih dari 24 jam — loker disuspend, hubungi Super Admin untuk membuka.',
        },
      });
    }

    if (overdue.overdue && !(await this.dendaSudahLunas(sesiId))) {
      throw new ConflictException({
        error: {
          code: 'DENDA_BELUM_DIBAYAR',
          message: 'Sesi ini terlambat — bayar denda kekurangan dulu sebelum lanjut.',
        },
      });
    }

    return sesi;
  }

  private sesiTidakDitemukan() {
    return new NotFoundException({
      error: { code: 'SESI_TIDAK_DITEMUKAN', message: 'Sesi transaksi tidak ditemukan.' },
    });
  }
}
