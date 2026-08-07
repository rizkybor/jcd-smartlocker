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

export type UnitStatus = {
  kodeUnit: string;
  modePemakaian: 'BERBAYAR' | 'GRATIS';
  unitPenuh: boolean;
  jumlahTersedia: number;
  jumlahTotal: number;
  durasiHarga: UnitDurasiHarga[];
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

export type AmbilSesi = { id: string };

export const kioskApi = {
  statusUnit: () => request<{ data: UnitStatus }>('/kiosk/unit/status'),

  validasiHp: (nomorHp: string) =>
    request<{ data: { valid: true } }>('/kiosk/sewa/validasi-hp', {
      method: 'POST',
      body: JSON.stringify({ nomorHp }),
    }),

  mulaiSewa: (nomorHp: string, email: string, unitDurasiHargaId: string) =>
    request<{ data: SesiTransaksi }>('/kiosk/sewa/mulai', {
      method: 'POST',
      body: JSON.stringify({ nomorHp, email, unitDurasiHargaId }),
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
};
