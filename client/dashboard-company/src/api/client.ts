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

export const companyApi = {
  me: () => request<{ data: Me }>('/company/me'),
  overview: () => request<{ data: OverviewRingkasan }>('/company/overview'),
};
