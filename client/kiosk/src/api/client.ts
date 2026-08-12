/**
 * Client HTTP kiosk — semua endpoint di sini otentikasi via `X-Unit-Key`
 * (docs/API-Contract-Smartbox.md §1.2, §2), bukan Bearer token Supabase.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const UNIT_KEY = import.meta.env.VITE_UNIT_KEY ?? '';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Unit-Key': UNIT_KEY,
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const errorBody = body?.error as { code?: string; message?: string } | undefined;
    throw new ApiError(
      errorBody?.code ?? 'UNKNOWN_ERROR',
      errorBody?.message ?? 'Terjadi kesalahan. Silakan coba lagi.',
      res.status,
    );
  }

  return body as T;
}

// --- Tipe respons (docs/API-Contract-Smartbox.md §2) ---

export type UnitDurasiHarga = { id: string; durasiJam: number; harga: number };

export type LokerStatus = 'TERSEDIA' | 'TERISI' | 'MAINTENANCE' | 'OFFLINE' | 'NONAKTIF';

/** Loker individual dalam 1 kategori (fitur pilih loker spesifik, di luar PRD awal) — dipakai LokerScreen. */
export type LokerButon = { id: string; nomorLoker: string; status: LokerStatus };

/**
 * Kategori ukuran loker (fitur harga & pilihan per ukuran, di luar PRD
 * awal) — satu unit fisik bisa punya beberapa kategori, masing-masing
 * dengan daftar durasi/harga & ketersediaan SENDIRI.
 */
export type KategoriLoker = {
  id: string;
  nama: string;
  ukuranWMm: number | null;
  ukuranHMm: number | null;
  jumlahTersedia: number;
  /** Daftar loker individual di kategori ini (fitur pilih loker spesifik, di luar PRD awal). */
  lokers: LokerButon[];
  durasiHarga: UnitDurasiHarga[];
};

export type UnitStatus = {
  kodeUnit: string;
  /** Nama mitra pemilik unit — ditampilkan di layar awal kiosk (di luar cakupan PRD awal). */
  mitraNama: string | null;
  modePemakaian: 'BERBAYAR' | 'GRATIS';
  unitPenuh: boolean;
  jumlahTersedia: number;
  jumlahTotal: number;
  kategori: KategoriLoker[];
};

export type SesiTransaksi = {
  id: string;
  idTransaksi: string;
  statusBayar: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
};

export type BuatPembayaranResult = { qrString: string; expiredAt: string; nominal: number };
export type StatusBayarResult = { statusBayar: SesiTransaksi['statusBayar'] };
export type StrukResult = {
  idTransaksi: string;
  nomorLoker: string;
  durasiJam: number;
  nominal: number;
  berlakuSampai: string | null;
};

/**
 * Status keterlambatan ambil barang (fitur overdue/denda/suspend, di luar
 * PRD awal — permintaan bisnis langsung). `suspended: true` -> lewat 24
 * jam, kiosk TIDAK menawarkan bayar sendiri lagi, cuma bisa hubungi admin.
 */
export type AmbilSesi = {
  id: string;
  overdue: boolean;
  suspended: boolean;
  jamTerlambat: number;
  dendaNominal: number;
};

export type BayarDendaResult = { qrString: string; expiredAt: string; nominal: number; jamTerlambat: number };
export type StatusDendaResult = { statusBayar: SesiTransaksi['statusBayar'] };

/**
 * Fitur member RFID/kode unik (di luar cakupan PRD awal — permintaan
 * bisnis langsung, lihat catatan model `Member` di schema.prisma backend).
 * Satu endpoint tap dibedakan 3 jenis hasil:
 * - `EKSKLUSIF`: loker sendiri member ini — pintu SUDAH dibuka server-side,
 *   kiosk tinggal tampilkan konfirmasi (`aksi` simpan/ambil).
 * - `UMUM_MEMBER_BARU`: member umum, belum ada sesi aktif — kiosk lanjut
 *   alur pilih kategori/durasi seperti biasa TAPI pakai `memberId` (bukan
 *   nomorHp/email) saat panggil `mulaiSewa`.
 * - `UMUM_SESI_AKTIF`: member umum sudah punya sesi aktif — ini tap AMBIL,
 *   kiosk ikut alur denda/suspend yang sama seperti ambil biasa, tapi buka
 *   pintu lewat `rfidBukaPintu` (skip OTP — tap = otorisasi).
 */
export type RfidScanResult =
  | { jenis: 'EKSKLUSIF'; aksi: 'simpan' | 'ambil'; nomorLoker: string }
  | { jenis: 'UMUM_MEMBER_BARU'; memberId: string; nama: string; diskonPersen: number }
  | ({ jenis: 'UMUM_SESI_AKTIF' } & AmbilSesi);

export const kioskApi = {
  statusUnit: () => request<{ data: UnitStatus }>('/kiosk/unit/status'),

  validasiHp: (nomorHp: string) =>
    request<{ data: { valid: true } }>('/kiosk/sewa/validasi-hp', {
      method: 'POST',
      body: JSON.stringify({ nomorHp }),
    }),

  mulaiSewa: (
    payload: { unitDurasiHargaId: string; lokerId?: string } & ({ nomorHp: string; email: string } | { memberId: string }),
  ) =>
    request<{ data: SesiTransaksi }>('/kiosk/sewa/mulai', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  buatPembayaran: (sesiId: string) =>
    request<{ data: BuatPembayaranResult }>(`/kiosk/sewa/${sesiId}/bayar`, { method: 'POST' }),

  cekStatusBayar: (sesiId: string) => request<{ data: StatusBayarResult }>(`/kiosk/sewa/${sesiId}/status`),

  bukaPintu: (sesiId: string) =>
    request<{ data: SesiTransaksi }>(`/kiosk/sewa/${sesiId}/buka-pintu`, { method: 'POST' }),

  struk: (sesiId: string) => request<{ data: StrukResult }>(`/kiosk/sewa/${sesiId}/struk`),

  // --- Ambil Barang (PRD §5.2) ---

  mulaiAmbil: (nomorHp: string) =>
    request<{ data: AmbilSesi }>('/kiosk/ambil/mulai', {
      method: 'POST',
      body: JSON.stringify({ nomorHp }),
    }),

  kirimOtpAmbil: (sesiId: string) =>
    request<{ data: { terkirim: true } }>('/kiosk/ambil/kirim-otp', {
      method: 'POST',
      body: JSON.stringify({ sesiId }),
    }),

  verifikasiOtpAmbil: (sesiId: string, kode: string) =>
    request<{ data: { valid: true } }>('/kiosk/ambil/verifikasi-otp', {
      method: 'POST',
      body: JSON.stringify({ sesiId, kode }),
    }),

  bukaPintuAmbil: (sesiId: string) =>
    request<{ data: SesiTransaksi }>(`/kiosk/ambil/${sesiId}/buka-pintu`, { method: 'POST' }),

  bayarDenda: (sesiId: string) =>
    request<{ data: BayarDendaResult }>(`/kiosk/ambil/${sesiId}/bayar-denda`, { method: 'POST' }),

  cekStatusDenda: (sesiId: string) => request<{ data: StatusDendaResult }>(`/kiosk/ambil/${sesiId}/status-denda`),

  // --- Member RFID (di luar cakupan PRD awal) ---

  rfidScan: (kode: string) =>
    request<{ data: RfidScanResult }>('/kiosk/rfid/scan', { method: 'POST', body: JSON.stringify({ kode }) }),

  rfidBukaPintu: (sesiId: string) =>
    request<{ data: SesiTransaksi }>(`/kiosk/rfid/${sesiId}/buka-pintu`, { method: 'POST' }),
};
