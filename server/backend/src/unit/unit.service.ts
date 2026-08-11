import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { LogKategori, LokerStatus, StatusBayar, TipeSkema } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { MqttClientService } from '../gateway/mqtt-client.service';
import { LokasiService } from '../lokasi/lokasi.service';
import { computeOverdueStatus, tarifPerJamTermurah } from '../common/overdue.util';
import type { AuthenticatedInternalUser } from '../auth/types';
import type { CreateUnitDto } from './dto/create-unit.dto';
import type { UpdateUnitDto } from './dto/update-unit.dto';
import type { BukaPaksaDto } from './dto/buka-paksa.dto';
import type { LokerStatusDto } from './dto/loker-status.dto';

function generateUnitKey(): string {
  return `uk_${randomBytes(24).toString('hex')}`;
}

/**
 * Lebar padding TETAP (bukan dihitung dari total saat ini) — unit bisa
 * bertambah loker/kategori belakangan lewat update() (fitur kategori
 * ukuran), jadi kalau lebar ikut jumlah saat itu saja, nomor loker lama
 * ("01") & baru ("001") bisa beda lebar dalam satu unit -> `ORDER BY
 * nomor_loker` (string, bukan numerik, di mulaiSewa()) jadi salah urut.
 * 3 digit cukup untuk 999 loker per unit, jauh di atas kebutuhan realistis.
 */
const LEBAR_NOMOR_LOKER = 3;

function nomorLokerFromIndex(index: number): string {
  return String(index + 1).padStart(LEBAR_NOMOR_LOKER, '0');
}

/**
 * `mitra` di-include LANGSUNG (owner, di luar cakupan PRD awal) — bukan
 * lagi diturunkan tidak langsung lewat `lokasi.mitraLokasi[].mitra` (itu
 * ambigu kalau 1 Lokasi dipakai lebih dari 1 mitra). `lokasi` sekarang
 * murni "di mana unit ini ditempatkan secara fisik".
 */
const unitListInclude = {
  mitra: true,
  lokasi: {
    include: {
      mitraLokasi: { include: { mitra: true } },
    },
  },
  lokers: true,
  durasiHarga: true,
  lokerKategori: true,
} as const;

function omitUnitKey<T extends { unitKey: string }>({ unitKey: _unitKey, ...rest }: T) {
  return rest;
}

@Injectable()
export class UnitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
    private readonly mqttClient: MqttClientService,
    private readonly lokasiService: LokasiService,
  ) {}

  async list(page: number, pageSize: number) {
    const [data, totalItems] = await Promise.all([
      this.prisma.db.unit.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: unitListInclude,
      }),
      this.prisma.db.unit.count(),
    ]);

    return {
      data: data.map(omitUnitKey),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  }

  async findOneOrThrow(id: string) {
    const unit = await this.prisma.db.unit.findUnique({
      where: { id },
      include: unitListInclude,
    });
    if (!unit) throw this.unitTidakDitemukan();

    // Riwayat transaksi (§5.1 "Detail unit + daftar loker + riwayat
    // transaksi") — 20 sesi terakhir lintas semua loker unit ini.
    const riwayatTransaksi = await this.prisma.db.sesiTransaksi.findMany({
      where: { loker: { unitId: id } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { loker: { select: { nomorLoker: true } } },
    });

    return { ...omitUnitKey(unit), lokers: await this.lokersDenganOverdueStatus(unit), riwayatTransaksi };
  }

  /**
   * Sisipkan status overdue/denda/suspend (fitur di luar cakupan PRD awal,
   * lihat overdue.util.ts) ke tiap loker TERISI unit ini — supaya Dashboard
   * Company bisa tampilkan badge "Disuspend" & tombol buka khusus Super
   * Admin tanpa panggilan API terpisah.
   */
  private async lokersDenganOverdueStatus(unit: {
    durasiHarga: { harga: unknown; durasiJam: number; aktif: boolean; lokerKategoriId: string }[];
    lokers: { id: string; status: LokerStatus; lokerKategoriId: string }[];
  }) {
    // Tarif per jam dihitung PER KATEGORI (bukan dirata unit) — kategori
    // beda harga bisa jauh beda, jangan salah kenakan denda loker "Besar"
    // pakai tarif loker "Kecil" atau sebaliknya.
    const durasiHargaPerKategori = new Map<string, { harga: number; durasiJam: number; aktif: boolean }[]>();
    for (const d of unit.durasiHarga) {
      const list = durasiHargaPerKategori.get(d.lokerKategoriId) ?? [];
      list.push({ harga: Number(d.harga), durasiJam: d.durasiJam, aktif: d.aktif });
      durasiHargaPerKategori.set(d.lokerKategoriId, list);
    }
    const tarifPerJamPerKategori = new Map<string, number | null>();
    for (const [kategoriId, list] of durasiHargaPerKategori) {
      tarifPerJamPerKategori.set(kategoriId, tarifPerJamTermurah(list));
    }

    const lokerTerisiIds = unit.lokers.filter((l) => l.status === LokerStatus.TERISI).map((l) => l.id);
    const sesiAktifList = lokerTerisiIds.length
      ? await this.prisma.db.sesiTransaksi.findMany({
          where: { lokerId: { in: lokerTerisiIds }, statusBayar: StatusBayar.PAID, waktuMulai: { not: null } },
          orderBy: { createdAt: 'desc' },
          select: { lokerId: true, waktuSelesai: true },
        })
      : [];

    const waktuSelesaiPerLoker = new Map<string, Date | null>();
    for (const s of sesiAktifList) {
      if (!waktuSelesaiPerLoker.has(s.lokerId)) waktuSelesaiPerLoker.set(s.lokerId, s.waktuSelesai);
    }

    return unit.lokers.map((l) => ({
      ...l,
      overdueStatus: waktuSelesaiPerLoker.has(l.id)
        ? computeOverdueStatus(waktuSelesaiPerLoker.get(l.id) ?? null, tarifPerJamPerKategori.get(l.lokerKategoriId) ?? null)
        : null,
    }));
  }

  /**
   * `unitKey` HANYA muncul di response create ini — tidak pernah
   * dikembalikan lagi oleh endpoint lain (list/detail), selaras perlakuan
   * secret di §7.1.
   *
   * Fitur harga & pilihan per ukuran loker (di luar cakupan PRD awal):
   * satu Unit fisik dibuat sekaligus dengan >=1 LokerKategori, masing-
   * masing punya loker & daftar durasi/harga SENDIRI. Nomor loker
   * diberikan BERURUTAN LINTAS kategori (001, 002, ... dst.), bukan
   * reset per kategori, supaya tetap unik per unit (`@@unique([unitId,
   * nomorLoker])`).
   */
  async create(dto: CreateUnitDto) {
    const mitra = await this.prisma.db.mitra.findUnique({ where: { id: dto.mitraId } });
    if (!mitra) {
      throw new NotFoundException({ error: { code: 'MITRA_TIDAK_DITEMUKAN', message: 'Mitra (owner) tidak ditemukan.' } });
    }

    const lokasi = await this.lokasiService.resolveOrCreateLokasi(dto);

    // Pastikan baris MitraLokasi(mitraId, lokasiId) ada — supaya revenue-
    // sharing & isolasi Dashboard Mitra (AkunMitraLokasi->Lokasi) tetap
    // jalan otomatis tanpa langkah manual terpisah (§ konfirmasi bisnis,
    // di luar cakupan PRD awal). Default FIXED_RENTAL kalau baru dibuat —
    // Super Admin bisa ubah skema-nya lewat alur Partner/skema-histori.
    const mitraLokasiAda = await this.prisma.db.mitraLokasi.findFirst({
      where: { mitraId: dto.mitraId, lokasiId: lokasi.id },
    });
    if (!mitraLokasiAda) {
      await this.prisma.db.mitraLokasi.create({
        data: { mitraId: dto.mitraId, lokasiId: lokasi.id, tipeSkema: TipeSkema.FIXED_RENTAL },
      });
    }

    const unitKey = generateUnitKey();
    const totalLoker = dto.kategori.reduce((sum, k) => sum + k.jumlahLoker, 0);

    return this.prisma.db.$transaction(async (tx) => {
      const unit = await tx.unit.create({
        data: {
          mitraId: dto.mitraId,
          lokasiId: lokasi.id,
          kodeUnit: dto.kodeUnit,
          unitKey,
          varianKompartemen: dto.varianKompartemen,
          jumlahLoker: totalLoker,
          modePemakaian: dto.modePemakaian,
        },
      });

      let nomorMulai = 0;
      for (const k of dto.kategori) {
        const kategoriRow = await tx.lokerKategori.create({
          data: { unitId: unit.id, nama: k.nama, ukuranWMm: k.ukuranWMm, ukuranHMm: k.ukuranHMm },
        });

        await tx.loker.createMany({
          data: Array.from({ length: k.jumlahLoker }, (_, i) => ({
            unitId: unit.id,
            lokerKategoriId: kategoriRow.id,
            nomorLoker: nomorLokerFromIndex(nomorMulai + i),
          })),
        });
        nomorMulai += k.jumlahLoker;

        await tx.unitDurasiHarga.createMany({
          data: k.durasiHarga.map((d) => ({
            unitId: unit.id,
            lokerKategoriId: kategoriRow.id,
            durasiJam: d.durasiJam,
            harga: d.harga,
          })),
        });
      }

      const lokers = await tx.loker.findMany({ where: { unitId: unit.id } });
      const durasiHarga = await tx.unitDurasiHarga.findMany({ where: { unitId: unit.id } });
      const lokerKategori = await tx.lokerKategori.findMany({ where: { unitId: unit.id } });

      return { ...unit, lokers, durasiHarga, lokerKategori };
    });
  }

  /**
   * docs/API-Contract-Smartbox.md §5.1 — PATCH /company/units/:id.
   * `kategori`, kalau dikirim, di-sync per kategori (lihat catatan di
   * update-unit.dto.ts) — bukan replace destruktif.
   */
  async update(id: string, dto: UpdateUnitDto, actor: AuthenticatedInternalUser) {
    const existing = await this.prisma.db.unit.findUnique({ where: { id } });
    if (!existing) throw this.unitTidakDitemukan();

    const unit = await this.prisma.db.$transaction(async (tx) => {
      const updated = await tx.unit.update({
        where: { id },
        data: {
          varianKompartemen: dto.varianKompartemen,
          modePemakaian: dto.modePemakaian,
          aktif: dto.aktif,
        },
      });

      if (dto.kategori) {
        for (const k of dto.kategori) {
          const kategoriId = k.id
            ? (await tx.lokerKategori.update({ where: { id: k.id }, data: { nama: k.nama, ukuranWMm: k.ukuranWMm, ukuranHMm: k.ukuranHMm } })).id
            : (
                await tx.lokerKategori.create({
                  data: { unitId: id, nama: k.nama, ukuranWMm: k.ukuranWMm, ukuranHMm: k.ukuranHMm },
                })
              ).id;

          if (!k.id) {
            // Kategori baru — provisikan loker fisiknya sekalian (jumlahLoker wajib divalidasi Zod untuk kasus ini).
            const nomorTerpakai = await tx.loker.findMany({ where: { unitId: id }, select: { nomorLoker: true } });
            const nomorTerbesar = nomorTerpakai.reduce((max, l) => Math.max(max, Number(l.nomorLoker) || 0), 0);
            await tx.loker.createMany({
              data: Array.from({ length: k.jumlahLoker ?? 0 }, (_, i) => ({
                unitId: id,
                lokerKategoriId: kategoriId,
                nomorLoker: nomorLokerFromIndex(nomorTerbesar + i),
              })),
            });
            await tx.unit.update({ where: { id }, data: { jumlahLoker: { increment: k.jumlahLoker ?? 0 } } });
          }

          const dikirimIds = k.durasiHarga.filter((d) => d.id).map((d) => d.id!);
          await tx.unitDurasiHarga.updateMany({
            where: { unitId: id, lokerKategoriId: kategoriId, id: { notIn: dikirimIds } },
            data: { aktif: false },
          });
          for (const d of k.durasiHarga) {
            if (d.id) {
              await tx.unitDurasiHarga.update({
                where: { id: d.id },
                data: { durasiJam: d.durasiJam, harga: d.harga, aktif: true },
              });
            } else {
              await tx.unitDurasiHarga.create({
                data: { unitId: id, lokerKategoriId: kategoriId, durasiJam: d.durasiJam, harga: d.harga },
              });
            }
          }
        }
      }

      return updated;
    });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.OPERASIONAL,
      aksi: 'ubah_konfigurasi_unit',
      entitas: 'unit',
      entitasId: id,
      detail: dto,
    });

    return omitUnitKey(unit);
  }

  /** Soft delete (§6) — wajib alasan, dicatat ke LOG_AKTIVITAS. */
  async softDelete(id: string, alasan: string, actor: AuthenticatedInternalUser) {
    const existing = await this.prisma.db.unit.findUnique({ where: { id } });
    if (!existing) throw this.unitTidakDitemukan();

    await this.prisma.softDelete('unit', id);

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.OPERASIONAL,
      aksi: 'nonaktifkan_unit',
      entitas: 'unit',
      entitasId: id,
      detail: { alasan },
    });

    return { deleted: true };
  }

  /**
   * Remote force-open (§2 Tujuan Produk, §5.1) — wajib alasan, kategori
   * `keamanan` (§7.1), BUKAN EmergencyUnlockLog (itu untuk kunci fisik
   * manual oleh Staff, SMB-110; ini remote software trigger oleh
   * Super Admin/Ops).
   *
   * TODO (Epic 5, Gateway Hardware/MQTT — belum dibangun): sama seperti
   * kiosk-sewa.service.ts/kiosk-ambil.service.ts, seharusnya publish
   * perintah MQTT & tunggu ack sensor. Untuk sekarang cuma dicatat ke
   * LOG_AKTIVITAS tanpa konfirmasi hardware sungguhan.
   */
  async bukaPaksa(unitId: string, dto: BukaPaksaDto, actor: AuthenticatedInternalUser) {
    const loker = await this.prisma.db.loker.findFirst({
      where: { id: dto.lokerId, unitId },
    });
    if (!loker) {
      throw new NotFoundException({
        error: { code: 'LOKER_TIDAK_DITEMUKAN', message: 'Loker tidak ditemukan di unit ini.' },
      });
    }

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.KEAMANAN,
      aksi: 'buka_paksa_pintu',
      entitas: 'loker',
      entitasId: loker.id,
      detail: { alasan: dto.alasan },
    });

    return { triggered: true };
  }

  /**
   * Buka loker yang DISUSPEND karena keterlambatan ambil barang >= 24 jam
   * (fitur overdue/denda/suspend, di luar cakupan PRD awal — lihat
   * overdue.util.ts). SENGAJA `@Roles(SUPER_ADMIN)` SAJA di controller —
   * BUKAN Ops juga seperti bukaPaksa() di atas — karena ini jalur terakhir
   * setelah penyewa sama sekali tidak bisa lagi bayar/buka sendiri lewat
   * kiosk. Beda dari bukaPaksa()/EmergencyUnlockLog (keduanya cuma
   * mencatat), method ini BENAR-BENAR publish perintah MQTT (sama seperti
   * kiosk-ambil.service.ts::bukaPintu()) supaya barang penyewa bisa
   * benar-benar diambil — tidak ada "staf sudah buka manual" untuk dicatat
   * di kasus ini.
   */
  async bukaLokerSuspended(unitId: string, dto: BukaPaksaDto, actor: AuthenticatedInternalUser) {
    const loker = await this.prisma.db.loker.findFirst({
      where: { id: dto.lokerId, unitId },
      include: { unit: true },
    });
    if (!loker) {
      throw new NotFoundException({
        error: { code: 'LOKER_TIDAK_DITEMUKAN', message: 'Loker tidak ditemukan di unit ini.' },
      });
    }

    const sesi = await this.prisma.db.sesiTransaksi.findFirst({
      where: { lokerId: loker.id, statusBayar: StatusBayar.PAID, loker: { status: LokerStatus.TERISI } },
      orderBy: { createdAt: 'desc' },
      include: { unitDurasiHarga: { include: { lokerKategori: { include: { durasiHarga: true } } } } },
    });
    if (!sesi) {
      throw new NotFoundException({
        error: { code: 'SESI_TIDAK_DITEMUKAN', message: 'Tidak ada sesi aktif pada loker ini.' },
      });
    }

    // Tarif per jam dari kategori loker SESI INI saja (bukan dirata unit) —
    // konsisten dengan lokersDenganOverdueStatus() & kiosk-ambil.service.ts.
    const tarifPerJam = tarifPerJamTermurah(
      sesi.unitDurasiHarga.lokerKategori.durasiHarga.map((d) => ({ harga: Number(d.harga), durasiJam: d.durasiJam, aktif: d.aktif })),
    );
    const overdue = computeOverdueStatus(sesi.waktuSelesai, tarifPerJam);
    if (!overdue.suspended) {
      throw new ConflictException({
        error: {
          code: 'LOKER_BELUM_DISUSPEND',
          message: 'Loker ini belum melewati 24 jam keterlambatan — belum berstatus suspend.',
        },
      });
    }

    this.mqttClient.publishPerintahBukaPintu(loker.unit.kodeUnit, loker.nomorLoker, sesi.id);

    await this.prisma.db.loker.update({ where: { id: loker.id }, data: { status: LokerStatus.TERSEDIA } });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.KEAMANAN,
      aksi: 'buka_loker_suspend',
      entitas: 'loker',
      entitasId: loker.id,
      detail: { alasan: dto.alasan, sesiTransaksiId: sesi.id, jamTerlambat: overdue.jamTerlambat },
    });

    return { triggered: true, jamTerlambat: overdue.jamTerlambat };
  }

  async updateLokerStatus(lokerId: string, dto: LokerStatusDto, actor: AuthenticatedInternalUser) {
    const loker = await this.prisma.db.loker.findUnique({ where: { id: lokerId } });
    if (!loker) {
      throw new NotFoundException({
        error: { code: 'LOKER_TIDAK_DITEMUKAN', message: 'Loker tidak ditemukan.' },
      });
    }
    if (loker.status === dto.status) {
      throw new ConflictException({
        error: { code: 'STATUS_SAMA', message: `Loker sudah berstatus ${dto.status}.` },
      });
    }

    const updated = await this.prisma.db.loker.update({
      where: { id: lokerId },
      data: { status: dto.status },
    });

    await this.activityLog.log({
      aktorId: actor.id,
      aktorRole: actor.role,
      kategori: LogKategori.OPERASIONAL,
      aksi: 'ubah_status_loker',
      entitas: 'loker',
      entitasId: lokerId,
      detail: { dari: loker.status, ke: dto.status },
    });

    return updated;
  }

  private unitTidakDitemukan() {
    return new NotFoundException({
      error: { code: 'UNIT_TIDAK_DITEMUKAN', message: 'Unit tidak ditemukan.' },
    });
  }
}
