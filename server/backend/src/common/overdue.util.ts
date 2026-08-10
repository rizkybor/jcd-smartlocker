/**
 * Perhitungan keterlambatan ambil barang (fitur overdue/denda/suspend, di
 * luar cakupan PRD awal — permintaan bisnis langsung).
 *
 * Aturan (dikonfirmasi dengan pemilik produk):
 * - Sewa selesai (`waktuSelesai`) terlewati TAPI belum 24 jam -> loker
 *   TETAP TERKUNCI, penyewa wajib bayar denda kekurangan sebelum bisa
 *   verifikasi OTP/buka pintu.
 * - Terlambat >= 24 jam sejak `waktuSelesai` -> loker DISUSPEND, penyewa
 *   TIDAK BISA bayar/buka sendiri lewat kiosk lagi — hanya Super Admin yang
 *   bisa membuka (lihat unit.service.ts bukaLokerSuspended()).
 * - Denda per jam = tarif per-jam TERMURAH yang aktif di unit itu sendiri
 *   (bukan tarif global) — unit berbeda ukuran/harga (Super Admin yang
 *   menentukan saat setup unit), jadi denda otomatis ikut tarif unit
 *   tersebut. Jam overdue dibulatkan KE ATAS (2 jam 15 menit -> 3 jam),
 *   konsisten dengan tarif sewa yang juga dijual per blok jam, bukan
 *   per-menit.
 */

const SATU_JAM_MS = 60 * 60 * 1000;
const AMBANG_SUSPEND_MS = 24 * SATU_JAM_MS;

export type OverdueStatus =
  | { overdue: false; suspended: false; jamTerlambat: 0; dendaNominal: 0 }
  | { overdue: true; suspended: false; jamTerlambat: number; dendaNominal: number }
  | { overdue: true; suspended: true; jamTerlambat: number; dendaNominal: 0 };

/**
 * Tarif per jam termurah dari daftar UnitDurasiHarga aktif — dipakai
 * sebagai basis denda (lihat catatan di atas). `null` kalau tidak ada
 * tarif aktif sama sekali (seharusnya tidak terjadi kalau unit valid,
 * tapi jangan diam-diam anggap 0 kalau data memang tidak lengkap).
 */
export function tarifPerJamTermurah(
  durasiHarga: { harga: number; durasiJam: number; aktif: boolean }[],
): number | null {
  const aktifList = durasiHarga.filter((d) => d.aktif && d.durasiJam > 0);
  if (aktifList.length === 0) return null;
  return Math.min(...aktifList.map((d) => d.harga / d.durasiJam));
}

/** Status overdue/denda/suspend sesi pada waktu `now` (default: waktu sekarang). */
export function computeOverdueStatus(
  waktuSelesai: Date | null,
  tarifPerJam: number | null,
  now: Date = new Date(),
): OverdueStatus {
  if (!waktuSelesai || now.getTime() <= waktuSelesai.getTime()) {
    return { overdue: false, suspended: false, jamTerlambat: 0, dendaNominal: 0 };
  }

  const msTerlambat = now.getTime() - waktuSelesai.getTime();
  const jamTerlambat = Math.ceil(msTerlambat / SATU_JAM_MS);

  if (msTerlambat >= AMBANG_SUSPEND_MS) {
    return { overdue: true, suspended: true, jamTerlambat, dendaNominal: 0 };
  }

  const dendaNominal = Math.round(jamTerlambat * (tarifPerJam ?? 0));
  return { overdue: true, suspended: false, jamTerlambat, dendaNominal };
}
