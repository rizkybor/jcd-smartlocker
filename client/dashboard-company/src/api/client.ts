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

// --- Tipe respons (docs/API-Contract-Smartbox.md §5) ---

export type Me = { id: string; email: string; nama: string; role: 'SUPER_ADMIN' | 'OPS' | 'MANAGER' | 'STAFF' };

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

export type Mitra = { id: string; nama: string; kontak: string | null };

export type MitraLokasiRingkas = { id: string; mitraId: string; tipeSkema: 'FIXED_RENTAL' | 'REVENUE_SHARING'; mitra: Mitra };

export type LokasiDenganMitra = Lokasi & { mitraLokasi: MitraLokasiRingkas[] };

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
  deletedAt: string | null;
  createdAt: string;
  lokasi: LokasiDenganMitra;
  lokers: Loker[];
  durasiHarga: UnitDurasiHarga[];
};

export type SesiTransaksiRingkas = {
  id: string;
  idTransaksi: string;
  statusBayar: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  nominal: number;
  createdAt: string;
  loker: { nomorLoker: string };
};

export type UnitDetail = Unit & { riwayatTransaksi: SesiTransaksiRingkas[] };

export type Paginated<T> = { data: T[]; meta: { page: number; pageSize: number; totalItems: number; totalPages: number } };

export type CreateUnitInput = {
  lokasiId: string;
  kodeUnit: string;
  varianKompartemen?: string;
  jumlahLoker: number;
  modePemakaian: 'BERBAYAR' | 'GRATIS';
  durasiHarga: { durasiJam: number; harga: number }[];
};

export type UpdateUnitInput = {
  varianKompartemen?: string;
  modePemakaian?: 'BERBAYAR' | 'GRATIS';
  aktif?: boolean;
  durasiHarga?: { id?: string; durasiJam: number; harga: number }[];
};

export type TipeSkema = 'FIXED_RENTAL' | 'REVENUE_SHARING';
export type StatusApproval = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MitraLokasiFull = {
  id: string;
  mitraId: string;
  lokasiId: string;
  tipeSkema: TipeSkema;
  persentaseAktif: number | null;
  lokasi: Lokasi;
};

export type MitraFull = {
  id: string;
  nama: string;
  kontak: string | null;
  deletedAt: string | null;
  createdAt: string;
  mitraLokasi: MitraLokasiFull[];
};

export type SkemaHistoriRow = {
  id: string;
  mitraLokasiId: string;
  persentase: number;
  statusApproval: StatusApproval;
  diajukanOleh: string;
  disetujuiOleh: string | null;
  diajukanAt: string;
  disetujuiAt: string | null;
  berlakuDari: string | null;
  berlakuSampai: string | null;
};

export type CreateMitraInput = { nama: string; kontak?: string; lokasiId: string; tipeSkema: TipeSkema };

export const companyApi = {
  me: () => request<{ data: Me }>('/company/me'),
  overview: () => request<{ data: OverviewRingkasan }>('/company/overview'),

  lokasiList: () => request<Paginated<Lokasi>>('/company/lokasi?pageSize=100'),

  units: {
    list: (page: number, pageSize = 25) =>
      request<Paginated<Unit>>(`/company/units?page=${page}&pageSize=${pageSize}`),
    detail: (id: string) => request<{ data: UnitDetail }>(`/company/units/${id}`),
    create: (input: CreateUnitInput) =>
      request<{ data: Unit }>('/company/units', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: UpdateUnitInput) =>
      request<{ data: Unit }>(`/company/units/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    remove: (id: string, alasan: string) =>
      request<{ data: { deleted: true } }>(`/company/units/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ alasan }),
      }),
    bukaPaksa: (id: string, lokerId: string, alasan: string) =>
      request<{ data: { triggered: true } }>(`/company/units/${id}/buka-paksa`, {
        method: 'POST',
        body: JSON.stringify({ lokerId, alasan }),
      }),
  },

  lokerUpdateStatus: (id: string, status: LokerStatus) =>
    request<{ data: Loker }>(`/company/lokers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  mitra: {
    list: (page: number, pageSize = 25) =>
      request<Paginated<MitraFull>>(`/company/mitra?page=${page}&pageSize=${pageSize}`),
    detail: (id: string) => request<{ data: MitraFull }>(`/company/mitra/${id}`),
    create: (input: CreateMitraInput) =>
      request<{ data: MitraFull }>('/company/mitra', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: { nama?: string; kontak?: string }) =>
      request<{ data: MitraFull }>(`/company/mitra/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    remove: (id: string) => request<{ data: unknown }>(`/company/mitra/${id}`, { method: 'DELETE' }),
  },

  skemaHistori: {
    list: (mitraLokasiId: string) =>
      request<{ data: SkemaHistoriRow[] }>(`/company/mitra-lokasi/${mitraLokasiId}/skema-histori`),
    ajukan: (mitraLokasiId: string, persentase: number) =>
      request<{ data: SkemaHistoriRow }>(`/company/mitra-lokasi/${mitraLokasiId}/ajukan-skema`, {
        method: 'POST',
        body: JSON.stringify({ persentase }),
      }),
    approve: (historiId: string) =>
      request<{ data: SkemaHistoriRow }>(`/company/skema-histori/${historiId}/approve`, { method: 'POST' }),
    reject: (historiId: string) =>
      request<{ data: SkemaHistoriRow }>(`/company/skema-histori/${historiId}/reject`, { method: 'POST' }),
  },
};
