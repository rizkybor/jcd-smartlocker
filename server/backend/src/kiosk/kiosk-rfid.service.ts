import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Unit } from '@prisma/client';
import { LokerStatus, MetodeAkses, StatusBayar } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MqttClientService } from '../gateway/mqtt-client.service';
import { PAYMENT_PROVIDER } from '../payment/payment-provider.interface';
import type { PaymentProvider } from '../payment/payment-provider.interface';
import { generateIdTransaksi } from '../common/id-transaksi.util';
import { KioskAmbilService } from './kiosk-ambil.service';
import type { RfidScanDto } from './dto/rfid-scan.dto';

/**
 * Fitur member RFID/kode unik (di luar cakupan PRD awal — permintaan
 * bisnis langsung, lihat catatan model `Member` di schema.prisma). Satu
 * endpoint tap (`POST /kiosk/rfid/scan`) menangani DUA jenis member
 * sekaligus, dibedakan dari `lokerId`:
 *
 * - Member EKSKLUSIF (`lokerId` terisi): tap = TOGGLE — loker `tersedia`
 *   berarti tap ini "simpan" (buka utk isi barang), loker `terisi` berarti
 *   tap ini "ambil" (buka utk keluarkan barang). Gratis (`nominal` 0),
 *   TIDAK PERNAH overdue (`waktuSelesai` sengaja dibiarkan null selamanya
 *   — lihat overdue.util.ts: null = tidak pernah overdue).
 * - Member UMUM (`lokerId` null): tap PERTAMA (belum ada sesi aktif)
 *   berarti identifikasi utk SEWA baru (kiosk lanjut ke pilih
 *   kategori/durasi seperti biasa, lalu panggil `kiosk-sewa.service.ts`
 *   dengan `memberId` alih-alih nomorHp/email). Tap KEDUA (sudah ada sesi
 *   aktif) berarti AMBIL barang — ganti OTP, langsung buka pintu via
 *   `KioskAmbilService.bukaPintuViaRfid()` (tetap kena aturan denda/suspend
 *   yang sama seperti alur OTP biasa).
 */
@Injectable()
export class KioskRfidService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mqttClient: MqttClientService,
    private readonly kioskAmbilService: KioskAmbilService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  async scan(unit: Unit, dto: RfidScanDto) {
    const member = await this.prisma.db.member.findFirst({
      where: {
        kode: dto.kode,
        aktif: true,
        mitra: { mitraLokasi: { some: { lokasiId: unit.lokasiId } } },
      },
    });
    if (!member) {
      throw new NotFoundException({
        error: { code: 'MEMBER_TIDAK_DITEMUKAN', message: 'Kartu tidak terdaftar atau tidak berlaku di kiosk ini.' },
      });
    }

    if (member.lokerId) {
      return this.tapEksklusif(unit, member.id, member.lokerId);
    }

    const sesiAktif = await this.kioskAmbilService.cariSesiAktifMember(unit, member.id);
    if (sesiAktif) {
      return { jenis: 'UMUM_SESI_AKTIF' as const, ...sesiAktif };
    }

    return {
      jenis: 'UMUM_MEMBER_BARU' as const,
      memberId: member.id,
      nama: member.nama,
      diskonPersen: Number(member.diskonPersen ?? 0),
    };
  }

  private async tapEksklusif(unit: Unit, memberId: string, lokerId: string) {
    const loker = await this.prisma.db.loker.findUnique({
      where: { id: lokerId },
      include: { unit: true },
    });
    if (!loker || loker.unitId !== unit.id) {
      throw new ConflictException({
        error: { code: 'LOKER_BUKAN_DI_KIOSK_INI', message: 'Loker eksklusif kartu ini bukan di kiosk ini.' },
      });
    }

    if (loker.status === LokerStatus.TERSEDIA) {
      return this.bukaUntukSimpan(unit, memberId, loker.id, loker.nomorLoker, loker.lokerKategoriId);
    }

    return this.bukaUntukAmbil(memberId, loker);
  }

  private async bukaUntukSimpan(
    unit: Unit,
    memberId: string,
    lokerId: string,
    nomorLoker: string,
    lokerKategoriId: string,
  ) {
    const durasiHarga = await this.prisma.db.unitDurasiHarga.findFirst({
      where: { lokerKategoriId, aktif: true },
    });
    if (!durasiHarga) {
      throw new ConflictException({
        error: {
          code: 'KATEGORI_BELUM_DIKONFIGURASI',
          message: 'Kategori loker ini belum punya konfigurasi durasi/harga — hubungi Super Admin.',
        },
      });
    }

    const sesi = await this.prisma.db.$transaction(async (tx) => {
      await tx.loker.update({ where: { id: lokerId }, data: { status: LokerStatus.TERISI } });
      return tx.sesiTransaksi.create({
        data: {
          lokerId,
          unitDurasiHargaId: durasiHarga.id,
          memberId,
          metodeAkses: MetodeAkses.RFID,
          nominal: 0,
          statusBayar: StatusBayar.PAID,
          paymentProvider: this.paymentProvider.name,
          idTransaksi: generateIdTransaksi(),
          waktuMulai: new Date(),
        },
      });
    });

    this.mqttClient.publishPerintahBukaPintu(unit.kodeUnit, nomorLoker, sesi.id);

    return { jenis: 'EKSKLUSIF' as const, aksi: 'simpan' as const, nomorLoker };
  }

  private async bukaUntukAmbil(
    memberId: string,
    loker: { id: string; nomorLoker: string; unit: { kodeUnit: string } },
  ) {
    const sesi = await this.prisma.db.sesiTransaksi.findFirst({
      where: { lokerId: loker.id, memberId, loker: { status: LokerStatus.TERISI } },
      orderBy: { createdAt: 'desc' },
    });
    if (!sesi) {
      throw new ConflictException({
        error: {
          code: 'SESI_TIDAK_DITEMUKAN',
          message: 'Loker ini sedang terisi tapi bukan oleh sesi kartu member ini — hubungi Super Admin.',
        },
      });
    }

    this.mqttClient.publishPerintahBukaPintu(loker.unit.kodeUnit, loker.nomorLoker, sesi.id);

    await this.prisma.db.loker.update({ where: { id: loker.id }, data: { status: LokerStatus.TERSEDIA } });

    return { jenis: 'EKSKLUSIF' as const, aksi: 'ambil' as const, nomorLoker: loker.nomorLoker };
  }
}
