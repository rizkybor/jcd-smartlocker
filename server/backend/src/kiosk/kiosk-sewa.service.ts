import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Unit } from '@prisma/client';
import { LokerStatus, MetodeAkses, Prisma, StatusBayar } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_PROVIDER } from '../payment/payment-provider.interface';
import type { PaymentProvider } from '../payment/payment-provider.interface';
import { formatUtcInLokasiTimezone } from '../common/timezone.util';
import { generateIdTransaksi } from '../common/id-transaksi.util';
import { MqttClientService } from '../gateway/mqtt-client.service';
import type { MulaiSewaDto } from './dto/mulai-sewa.dto';

/**
 * Alur sewa loker (docs/PRD-Smartbox.md §5.1; docs/API-Contract-Smartbox.md
 * §2).
 */
@Injectable()
export class KioskSewaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    private readonly mqttClient: MqttClientService,
  ) {}

  /**
   * Fitur harga & pilihan per ukuran loker (di luar cakupan PRD awal —
   * permintaan bisnis langsung): durasi/harga dikelompokkan PER KATEGORI
   * ukuran loker unit ini, masing-masing dengan hitungan tersedia sendiri
   * — kiosk menampilkan ini sebagai langkah "pilih ukuran" sebelum "pilih
   * durasi" (lihat client/kiosk/src/screens/KategoriScreen.tsx).
   *
   * Fitur pilih loker spesifik (di luar cakupan PRD awal — permintaan
   * bisnis langsung): tiap kategori juga menyertakan daftar loker
   * INDIVIDUAL (nomor + status) supaya kiosk bisa menampilkan tombol per
   * nomor loker (001, 002, dst, lihat client/kiosk/src/screens/
   * LokerScreen.tsx), bukan cuma hitungan "3 tersedia". Loker yang diikat
   * eksklusif ke member (`memberEksklusif`) TETAP ditarik dari daftar ini
   * — pelanggan umum tidak boleh tahu/pilih loker yang cuma bisa dibuka
   * member tertentu (sama alasan seperti filter di `mulaiSewa()`).
   */
  async statusUnit(unit: Unit) {
    const [kategoriList, jumlahTersedia, jumlahTotal, mitra] = await Promise.all([
      this.prisma.db.lokerKategori.findMany({
        where: { unitId: unit.id, aktif: true },
        orderBy: { createdAt: 'asc' },
        include: {
          durasiHarga: { where: { aktif: true }, orderBy: { durasiJam: 'asc' } },
          lokers: {
            where: { deletedAt: null, memberEksklusif: null },
            orderBy: { nomorLoker: 'asc' },
            select: { id: true, nomorLoker: true, status: true },
          },
          _count: {
            select: {
              lokers: {
                where: { status: LokerStatus.TERSEDIA, deletedAt: null, memberEksklusif: null },
              },
            },
          },
        },
      }),
      this.prisma.db.loker.count({
        where: { unitId: unit.id, status: LokerStatus.TERSEDIA, memberEksklusif: null },
      }),
      this.prisma.db.loker.count({ where: { unitId: unit.id } }),
      /** Ditampilkan di layar awal kiosk (footnote) — di luar cakupan PRD awal. */
      this.prisma.db.mitra.findUnique({ where: { id: unit.mitraId }, select: { nama: true } }),
    ]);

    return {
      kodeUnit: unit.kodeUnit,
      mitraNama: mitra?.nama ?? null,
      modePemakaian: unit.modePemakaian,
      unitPenuh: jumlahTersedia === 0,
      jumlahTersedia,
      jumlahTotal,
      kategori: kategoriList.map((k) => ({
        id: k.id,
        nama: k.nama,
        ukuranWMm: k.ukuranWMm ? Number(k.ukuranWMm) : null,
        ukuranHMm: k.ukuranHMm ? Number(k.ukuranHMm) : null,
        jumlahTersedia: k._count.lokers,
        lokers: k.lokers.map((l) => ({ id: l.id, nomorLoker: l.nomorLoker, status: l.status })),
        durasiHarga: k.durasiHarga.map((d) => ({
          id: d.id,
          durasiJam: d.durasiJam,
          harga: Number(d.harga),
        })),
      })),
    };
  }

  /**
   * Assign loker otomatis — WAJIB atomik (docs/API-Contract-Smartbox.md
   * §2, catatan kritis): `SELECT ... FOR UPDATE SKIP LOCKED` di dalam
   * transaksi supaya dua request bersamaan tidak pernah mengklaim loker
   * `tersedia` yang sama. Prisma query builder tidak punya row-locking
   * eksplisit, jadi baris ini pakai raw SQL yang scoped ke transaksi.
   *
   * Fitur harga & pilihan per ukuran loker: kandidat loker WAJIB difilter
   * ke `loker_kategori_id` milik `durasiHarga` yang dipilih pelanggan —
   * bukan loker mana pun yang tersedia di unit itu — supaya pelanggan yang
   * pilih & bayar loker "Besar" tidak pernah di-assign ke loker "Kecil".
   *
   * Fitur member RFID (di luar cakupan PRD awal): loker yang sudah diikat
   * EKSKLUSIF ke member tertentu (`member.loker_id`) DITARIK dari pool
   * sewa umum sepenuhnya — bukan cuma saat member-nya sedang memakainya
   * (§ konfirmasi bisnis) — supaya pelanggan umum tidak pernah di-assign
   * ke loker yang seharusnya cuma bisa dibuka gratis oleh member itu.
   *
   * Fitur pilih loker spesifik (di luar cakupan PRD awal): kalau
   * `dto.lokerId` diisi (pelanggan pilih nomor loker sendiri lewat
   * LokerScreen), kandidat di-scope KHUSUS ke loker itu — masih lewat
   * `FOR UPDATE SKIP LOCKED` yang sama, supaya tetap atomik kalau ada 2
   * request bersamaan (mis. dobel-tap) berebut loker yang sama persis.
   * Kalau `lokerId` kosong, fallback ke assign otomatis kandidat pertama
   * seperti sebelumnya (jalur lama/RFID member).
   */
  async mulaiSewa(unit: Unit, dto: MulaiSewaDto) {
    const durasiHarga = await this.prisma.db.unitDurasiHarga.findFirst({
      where: { id: dto.unitDurasiHargaId, unitId: unit.id, aktif: true },
    });
    if (!durasiHarga) {
      throw new NotFoundException({
        error: {
          code: 'DURASI_TIDAK_DITEMUKAN',
          message: 'Pilihan durasi tidak ditemukan untuk unit ini.',
        },
      });
    }

    // Fitur member RFID: member "umum" dapat diskon dari tarif normal
    // kategori yang dia sewa — tetap sewa berdurasi biasa (kena denda kalau
    // telat), cuma identitasnya lewat memberId (dari tap kartu), bukan
    // nomorHp/email (§ konfirmasi bisnis, lihat mulai-sewa.dto.ts).
    let nominal = Number(durasiHarga.harga);
    if (dto.memberId) {
      const member = await this.prisma.db.member.findFirst({
        where: {
          id: dto.memberId,
          aktif: true,
          lokerId: null,
          mitra: { mitraLokasi: { some: { lokasiId: unit.lokasiId } } },
        },
      });
      if (!member) {
        throw new NotFoundException({
          error: { code: 'MEMBER_TIDAK_DITEMUKAN', message: 'Member tidak ditemukan atau tidak berlaku di kiosk ini.' },
        });
      }
      const diskonPersen = Number(member.diskonPersen ?? 0);
      nominal = Math.round(nominal * (1 - diskonPersen / 100));
    }

    return this.prisma.db.$transaction(async (tx) => {
      const kandidat = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT id FROM loker
        WHERE unit_id = ${unit.id}::uuid
          AND loker_kategori_id = ${durasiHarga.lokerKategoriId}::uuid
          AND status = 'tersedia'
          AND deleted_at IS NULL
          ${dto.lokerId ? Prisma.sql`AND id = ${dto.lokerId}::uuid` : Prisma.empty}
          AND NOT EXISTS (
            SELECT 1 FROM member m
            WHERE m.loker_id = loker.id AND m.aktif = true AND m.deleted_at IS NULL
          )
        ORDER BY LENGTH(nomor_loker), nomor_loker
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `);

      const loker = kandidat[0];
      if (!loker) {
        throw new ConflictException({
          error: {
            code: 'LOKER_TIDAK_TERSEDIA',
            message: 'Loker yang dipilih baru saja terisi. Silakan pilih loker lain.',
          },
        });
      }

      await tx.loker.update({ where: { id: loker.id }, data: { status: LokerStatus.TERISI } });

      return tx.sesiTransaksi.create({
        data: {
          lokerId: loker.id,
          unitDurasiHargaId: durasiHarga.id,
          nomorHp: dto.memberId ? null : dto.nomorHp,
          email: dto.memberId ? null : dto.email,
          memberId: dto.memberId,
          metodeAkses: dto.memberId ? MetodeAkses.RFID : MetodeAkses.NOMOR_HP,
          nominal,
          idTransaksi: generateIdTransaksi(),
          paymentProvider: this.paymentProvider.name,
        },
      });
    });
  }

  async buatPembayaran(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({ where: { id: sesiId } });
    if (!sesi) throw this.sesiTidakDitemukan();

    if (sesi.statusBayar !== StatusBayar.PENDING) {
      throw new ConflictException({
        error: {
          code: 'SESI_SUDAH_DIPROSES',
          message: 'Sesi ini sudah diproses sebelumnya, tidak bisa buat pembayaran baru.',
        },
      });
    }

    const charge = await this.paymentProvider.createQrisCharge({
      idTransaksi: sesi.idTransaksi,
      nominal: Number(sesi.nominal),
    });

    await this.prisma.db.sesiTransaksi.update({
      where: { id: sesi.id },
      data: { paymentProviderRefId: charge.providerRefId },
    });

    return {
      qrString: charge.qrString,
      expiredAt: charge.expiredAt,
      nominal: Number(sesi.nominal),
    };
  }

  async getStatusBayar(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({
      where: { id: sesiId },
      select: { statusBayar: true },
    });
    if (!sesi) throw this.sesiTidakDitemukan();
    return { statusBayar: sesi.statusBayar };
  }

  /**
   * TODO (Epic 5 sebagian — SMB-502-505/510 masih blocked hardware, PRD
   * §12 poin 1): perintah `buka_pintu` sudah di-publish ke MQTT
   * (docs/API-Contract-Smartbox.md §4.1), TAPI fire-and-forget, TIDAK
   * menunggu ack — belum ada gateway service fisik yang benar-benar
   * mengonsumsi topik ini & membalas ack. Status sesi masih langsung
   * ditandai aktif di database begitu API ini sukses, tanpa konfirmasi
   * hardware sungguhan — JANGAN dianggap "pintu benar-benar terbuka"
   * sampai SMB-502-505 selesai.
   */
  async bukaPintu(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({
      where: { id: sesiId },
      include: { unitDurasiHarga: true, loker: { include: { unit: true } } },
    });
    if (!sesi) throw this.sesiTidakDitemukan();

    if (sesi.statusBayar !== StatusBayar.PAID) {
      throw new ConflictException({
        error: {
          code: 'SESI_BELUM_DIBAYAR',
          message: 'Pembayaran belum terkonfirmasi, pintu tidak bisa dibuka.',
        },
      });
    }

    if (sesi.waktuMulai) {
      // Idempotent — sudah pernah dibuka sebelumnya.
      return sesi;
    }

    this.mqttClient.publishPerintahBukaPintu(sesi.loker.unit.kodeUnit, sesi.loker.nomorLoker, sesi.id);

    const waktuMulai = new Date();
    const waktuSelesai = new Date(
      waktuMulai.getTime() + sesi.unitDurasiHarga.durasiJam * 60 * 60 * 1000,
    );

    return this.prisma.db.sesiTransaksi.update({
      where: { id: sesi.id },
      data: { waktuMulai, waktuSelesai },
    });
  }

  async getStruk(sesiId: string) {
    const sesi = await this.prisma.db.sesiTransaksi.findUnique({
      where: { id: sesiId },
      include: {
        loker: { include: { unit: { include: { lokasi: true } } } },
        unitDurasiHarga: true,
      },
    });
    if (!sesi) throw this.sesiTidakDitemukan();

    const timezone = sesi.loker.unit.lokasi.timezone;

    return {
      idTransaksi: sesi.idTransaksi,
      nomorLoker: sesi.loker.nomorLoker,
      durasiJam: sesi.unitDurasiHarga.durasiJam,
      nominal: Number(sesi.nominal),
      berlakuSampai: sesi.waktuSelesai
        ? formatUtcInLokasiTimezone(sesi.waktuSelesai, timezone)
        : null,
    };
  }

  private sesiTidakDitemukan() {
    return new NotFoundException({
      error: { code: 'SESI_TIDAK_DITEMUKAN', message: 'Sesi transaksi tidak ditemukan.' },
    });
  }
}
