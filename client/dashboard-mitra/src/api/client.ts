import { supabase } from '../lib/supabase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
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

// --- Tipe respons (docs/API-Contract-Smartbox.md §6) ---

export type Me = { id: string; email: string; nama: string; mitraId: string; mitraNama: string };

export type OverviewRingkasan = {
  jumlahLokasi: number;
  jumlahUnit: number;
  jumlahLoker: number;
  lokerPerStatus: { tersedia: number; terisi: number; maintenance: number; offline: number; nonaktif: number };
  okupansiPersen: number;
  pendapatanTotal: number;
  unitOnline: number;
  unitOffline: number;
};

export type Lokasi = { id: string; nama: string; alamat: string; timezone: string };

export type LokerStatus = 'TERSEDIA' | 'TERISI' | 'MAINTENANCE' | 'OFFLINE' | 'NONAKTIF';

export type Loker = { id: string; unitId: string; nomorLoker: string; status: LokerStatus };

export type UnitDurasiHarga = { id: string; unitId: string; durasiJam: number; harga: number; aktif: boolean };

export type Unit = {
  id: string;
  lokasiId: string;
  kodeUnit: string;
  varianKompartemen: string | null;
  jumlahLoker: number;
  modePemakaian: 'BERBAYAR' | 'GRATIS';
  aktif: boolean;
  createdAt: string;
  lokasi: Lokasi;
  lokers: Loker[];
  durasiHarga: UnitDurasiHarga[];
};

export type Paginated<T> = { data: T[]; meta: { page: number; pageSize: number; totalItems: number; totalPages: number } };

export type LaporanTransaksiRow = {
  id: string;
  idTransaksi: string;
  tanggal: string;
  lokasiNama: string;
  nomorLoker: string;
  nominal: number;
  statusBayar: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
};

export type BagiHasilRingkasan = { jumlahTransaksi: number; totalNominal: number; totalBagiHasilMitra: number };

export type LaporanResult = Paginated<LaporanTransaksiRow> & { bagiHasil: BagiHasilRingkasan };

export type LaporanFilter = { tanggalMulai?: string; tanggalSelesai?: string; lokasiId?: string };

function laporanQuery(filter: LaporanFilter, page?: number, pageSize?: number): string {
  const params = new URLSearchParams();
  if (filter.tanggalMulai) params.set('tanggalMulai', filter.tanggalMulai);
  if (filter.tanggalSelesai) params.set('tanggalSelesai', filter.tanggalSelesai);
  if (filter.lokasiId) params.set('lokasiId', filter.lokasiId);
  if (page) params.set('page', String(page));
  if (pageSize) params.set('pageSize', String(pageSize));
  return params.toString();
}

export const mitraApi = {
  me: () => request<{ data: Me }>('/mitra/me'),
  overview: () => request<{ data: OverviewRingkasan }>('/mitra/overview'),

  units: (page: number, pageSize = 25) =>
    request<Paginated<Unit>>(`/mitra/units?page=${page}&pageSize=${pageSize}`),

  laporan: (filter: LaporanFilter, page: number, pageSize = 25) =>
    request<LaporanResult>(`/mitra/laporan?${laporanQuery(filter, page, pageSize)}`),

  export: (filter: LaporanFilter) =>
    request<{ data: { url: string } }>('/mitra/laporan/export', {
      method: 'POST',
      body: JSON.stringify(filter),
    }),
};
