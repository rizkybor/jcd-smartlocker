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

/** Monitoring lanjutan Overview (di luar cakupan PRD awal — permintaan bisnis langsung). */
export type OverviewTrenPoin = { tanggal: string; jumlahTransaksi: number; pendapatan: number };

export type OverviewMitraRow = {
  mitraId: string;
  mitraNama: string;
  jumlahUnit: number;
  okupansiPersen: number;
  pendapatanBulanIni: number;
  pendapatanTotal: number;
};

/** Rincian penghasilan per Unit Locker milik 1 mitra — dipakai MitraDetailPage. */
export type OverviewMitraUnitRow = {
  unitId: string;
  kodeUnit: string;
  lokasiNama: string;
  jumlahLoker: number;
  okupansiPersen: number;
  pendapatanBulanIni: number;
  pendapatanTotal: number;
};

export type OverviewMitraDetail = {
  mitraId: string;
  mitraNama: string;
  pendapatanTotal: number;
  pendapatanBulanIni: number;
  units: OverviewMitraUnitRow[];
};

export type OverviewLokerRow = {
  id: string;
  nomorLoker: string;
  kodeUnit: string;
  lokasiNama: string;
  status: LokerStatus;
  lastActivityAt: string | null;
  overdueStatus: OverdueStatus | null;
};

/** Wilayah administratif (Provinsi/Kab-Kota/Kecamatan/Kelurahan) — di luar cakupan PRD awal, lihat lib/wilayah.ts. */
export type Wilayah = {
  provinsiKode: string;
  provinsiNama: string;
  kabupatenKode: string;
  kabupatenNama: string;
  kecamatanKode: string;
  kecamatanNama: string;
  kelurahanKode: string;
  kelurahanNama: string;
};

export type Lokasi = { id: string; nama: string; alamat: string; timezone: string } & Wilayah;

/** Jumlah pemakaian aktif (di luar cakupan PRD awal) — dipakai LokasiPage untuk tahu "aman dihapus atau tidak" sebelum mencoba. */
export type LokasiDenganPemakaian = Lokasi & { _count: { units: number; mitraLokasi: number } };

/** Buat Lokasi baru inline (dipakai Mitra & Unit creation) — lihat `LokasiPilihan`. */
export type LokasiBaruInput = { nama: string; alamat: string; timezone: string; wilayah: Wilayah };

/** Reuse Lokasi existing (`lokasiId`) ATAU buat baru inline (`lokasiBaru`) — persis satu, tidak boleh dua-duanya. */
export type LokasiPilihan = { lokasiId: string; lokasiBaru?: never } | { lokasiId?: never; lokasiBaru: LokasiBaruInput };

export type Mitra = { id: string; nama: string; kontak: string | null };

export type MitraLokasiRingkas = { id: string; mitraId: string; tipeSkema: 'FIXED_RENTAL' | 'REVENUE_SHARING'; mitra: Mitra };

export type LokasiDenganMitra = Lokasi & { mitraLokasi: MitraLokasiRingkas[] };

export type LokerStatus = 'TERSEDIA' | 'TERISI' | 'MAINTENANCE' | 'OFFLINE' | 'NONAKTIF';

/** Fitur overdue/denda/suspend keterlambatan ambil barang (di luar cakupan PRD awal). */
export type OverdueStatus = { overdue: boolean; suspended: boolean; jamTerlambat: number; dendaNominal: number };

export type Loker = {
  id: string;
  unitId: string;
  lokerKategoriId: string;
  nomorLoker: string;
  status: LokerStatus;
  /** Cuma diisi di response detail unit (findOneOrThrow), bukan list. */
  overdueStatus?: OverdueStatus | null;
};

export type UnitDurasiHarga = { id: string; unitId: string; lokerKategoriId: string; durasiJam: number; harga: number; aktif: boolean };

/**
 * Kategori ukuran loker (fitur harga & pilihan per ukuran, di luar cakupan
 * PRD awal) — satu Unit fisik bisa punya beberapa kategori, masing-masing
 * dengan loker & daftar durasi/harga SENDIRI.
 */
export type LokerKategori = {
  id: string;
  unitId: string;
  nama: string;
  ukuranWMm: number | null;
  ukuranHMm: number | null;
  aktif: boolean;
};

export type Unit = {
  id: string;
  /** Owner — sumber kebenaran LANGSUNG (di luar cakupan PRD awal, dulu diturunkan tidak langsung lewat lokasi.mitraLokasi). */
  mitraId: string;
  mitra: Mitra;
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
  lokerKategori: LokerKategori[];
};

export type SesiTransaksiRingkas = {
  id: string;
  idTransaksi: string;
  statusBayar: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  nominal: number;
  createdAt: string;
  loker: { nomorLoker: string };
};

/** `unitKeyPreview` = 2 karakter depan + bintang tetap — cuma penanda "sudah ada", bukan bisa dipakai ulang (§7.1). */
export type UnitDetail = Unit & { riwayatTransaksi: SesiTransaksiRingkas[]; unitKeyPreview: string };

/** `unitKey` HANYA muncul di response create/regenerate ini — tidak pernah lagi setelahnya (§7.1, lihat unit.service.ts::create()). */
export type UnitDenganKey = Unit & { unitKey: string };

/** Response regenerate-key — bentuknya lebih ramping (tidak perlu semua field Unit). */
export type UnitKeyRegenerated = { kodeUnit: string; unitKey: string; unitKeyPreview: string };

export type Paginated<T> = { data: T[]; meta: { page: number; pageSize: number; totalItems: number; totalPages: number } };

export type KategoriInput = {
  id?: string;
  nama: string;
  ukuranWMm?: number;
  ukuranHMm?: number;
  /** Wajib untuk kategori baru (tanpa `id`) — diabaikan kalau kategori sudah ada. */
  jumlahLoker?: number;
  durasiHarga: { id?: string; durasiJam: number; harga: number }[];
};

export type CreateUnitInput = {
  /** Owner (di luar cakupan PRD awal) — terpisah dari `lokasi` (tempat unit ditaruh secara fisik). */
  mitraId: string;
  kodeUnit: string;
  varianKompartemen?: string;
  modePemakaian: 'BERBAYAR' | 'GRATIS';
  kategori: (KategoriInput & { jumlahLoker: number })[];
} & LokasiPilihan;

export type UpdateUnitInput = {
  varianKompartemen?: string;
  modePemakaian?: 'BERBAYAR' | 'GRATIS';
  aktif?: boolean;
  kategori?: KategoriInput[];
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
  /** Fitur member RFID (di luar cakupan PRD awal) — akses menu kelola member di Dashboard Mitra, default false. */
  bolehKelolaMember: boolean;
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

/** Buat login Dashboard Mitra sekaligus (di luar cakupan PRD awal) — password Super Admin isi langsung, bukan invite-link. */
export type AkunMitraBaruInput = { nama: string; email: string; password: string };

export type CreateMitraInput = {
  nama: string;
  kontak?: string;
  tipeSkema: TipeSkema;
  akunMitra: AkunMitraBaruInput;
} & LokasiPilihan;

export type LaporanFilter = { tanggalMulai?: string; tanggalSelesai?: string; lokasiId?: string; mitraId?: string };

export type LaporanTransaksiRow = {
  id: string;
  idTransaksi: string;
  tanggal: string;
  lokasiNama: string;
  mitraNama: string;
  nomorLoker: string;
  nominal: number;
  statusBayar: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
};

export type LaporanBagiHasilRow = {
  mitraId: string;
  mitraNama: string;
  lokasiId: string;
  lokasiNama: string;
  persentaseAktif: number | null;
  jumlahTransaksi: number;
  totalNominal: number;
  totalBagiHasilMitra: number;
  totalBagiHasilSmartbox: number;
};

export type AkunInternalRole = 'SUPER_ADMIN' | 'OPS' | 'MANAGER' | 'STAFF';

export type AkunInternal = {
  id: string;
  nama: string;
  email: string;
  role: AkunInternalRole;
  deletedAt: string | null;
  createdAt: string;
};

/**
 * Fitur member RFID/kode unik (di luar cakupan PRD awal — permintaan
 * bisnis langsung). Dibedakan lewat `lokerId`: terisi = member EKSKLUSIF 1
 * loker (gratis, bebas buka kapan saja), null = member UMUM (diskon tarif
 * normal) — lihat catatan model `Member` di schema.prisma backend.
 */
export type MemberRow = {
  id: string;
  mitraId: string;
  kode: string;
  nama: string;
  kontak: string | null;
  lokerId: string | null;
  diskonPersen: number | null;
  aktif: boolean;
  deletedAt: string | null;
  createdAt: string;
  mitra: { nama: string };
  loker: { id: string; nomorLoker: string; unit: { kodeUnit: string } } | null;
};

export type CreateMemberInput = {
  mitraId: string;
  kode: string;
  nama: string;
  kontak?: string;
  lokerId?: string;
  diskonPersen?: number;
};

export type UpdateMemberInput = {
  nama?: string;
  kontak?: string;
  lokerId?: string | null;
  diskonPersen?: number | null;
  aktif?: boolean;
};

export type EmergencyUnlockLogRow = {
  id: string;
  lokerId: string;
  staffId: string;
  catatan: string | null;
  waktuKejadian: string;
  waktuKejadianLokal: string;
  disinkronkanAt: string;
  staff: { nama: string; email: string };
  nomorLoker: string;
  kodeUnit: string;
  lokasiNama: string;
};

export type LogKategori = 'KEAMANAN' | 'OPERASIONAL';

export type LogAktivitasRow = {
  id: string;
  aktorId: string;
  aktorRole: string;
  kategori: LogKategori;
  aksi: string;
  entitas: string;
  entitasId: string | null;
  detail: unknown;
  createdAt: string;
  aktor: { nama: string; email: string };
};

function laporanQuery(filter: LaporanFilter, page?: number, pageSize?: number): string {
  const params = new URLSearchParams();
  if (filter.tanggalMulai) params.set('tanggalMulai', filter.tanggalMulai);
  if (filter.tanggalSelesai) params.set('tanggalSelesai', filter.tanggalSelesai);
  if (filter.lokasiId) params.set('lokasiId', filter.lokasiId);
  if (filter.mitraId) params.set('mitraId', filter.mitraId);
  if (page) params.set('page', String(page));
  if (pageSize) params.set('pageSize', String(pageSize));
  return params.toString();
}

export const companyApi = {
  me: () => request<{ data: Me }>('/company/me'),
  overview: () => request<{ data: OverviewRingkasan }>('/company/overview'),
  overviewTren: () => request<{ data: OverviewTrenPoin[] }>('/company/overview/tren'),
  overviewMitra: () => request<{ data: OverviewMitraRow[] }>('/company/overview/mitra'),
  overviewMitraDetail: (id: string) => request<{ data: OverviewMitraDetail }>(`/company/overview/mitra/${id}`),
  overviewLokers: (page: number, pageSize = 25, status?: LokerStatus, search?: string) =>
    request<Paginated<OverviewLokerRow>>(
      `/company/overview/lokers?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    ),

  lokasiList: () => request<Paginated<Lokasi>>('/company/lokasi?pageSize=100'),

  /** Manajemen Lokasi (di luar cakupan PRD awal) — Super Admin only, lihat lokasi.controller.ts. */
  lokasi: {
    list: (page: number, pageSize = 25) =>
      request<Paginated<LokasiDenganPemakaian>>(`/company/lokasi?page=${page}&pageSize=${pageSize}`),
    /** Ditolak (409, LOKASI_MASIH_DIPAKAI) kalau masih ada Unit/MitraLokasi aktif yang menunjuk ke lokasi ini. */
    remove: (id: string) => request<{ data: { deleted: true } }>(`/company/lokasi/${id}`, { method: 'DELETE' }),
  },

  units: {
    list: (page: number, pageSize = 25) =>
      request<Paginated<Unit>>(`/company/units?page=${page}&pageSize=${pageSize}`),
    detail: (id: string) => request<{ data: UnitDetail }>(`/company/units/${id}`),
    create: (input: CreateUnitInput) =>
      request<{ data: UnitDenganKey }>('/company/units', { method: 'POST', body: JSON.stringify(input) }),
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
    /** Regenerate unit key (di luar cakupan PRD awal) — key LAMA langsung invalid, dipakai kalau lupa/hilang. */
    regenerateKey: (id: string) =>
      request<{ data: UnitKeyRegenerated }>(`/company/units/${id}/regenerate-key`, { method: 'POST' }),
    /** Fitur overdue/denda/suspend (di luar cakupan PRD awal) — cuma Super Admin, lihat unit.service.ts::bukaLokerSuspended(). */
    bukaSuspend: (id: string, lokerId: string, alasan: string) =>
      request<{ data: { triggered: true; jamTerlambat: number } }>(`/company/units/${id}/buka-suspend`, {
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
    update: (id: string, input: { nama?: string; kontak?: string; bolehKelolaMember?: boolean }) =>
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

  laporan: {
    transaksi: (filter: LaporanFilter, page: number, pageSize = 25) =>
      request<Paginated<LaporanTransaksiRow>>(`/company/laporan/transaksi?${laporanQuery(filter, page, pageSize)}`),
    bagiHasil: (filter: LaporanFilter) =>
      request<{ data: LaporanBagiHasilRow[] }>(`/company/laporan/bagi-hasil?${laporanQuery(filter)}`),
    export: (jenis: 'transaksi' | 'bagi-hasil', filter: LaporanFilter) =>
      request<{ data: { url: string } }>('/company/laporan/export', {
        method: 'POST',
        body: JSON.stringify({ jenis, ...filter }),
      }),
  },

  users: {
    list: (page: number, pageSize = 25) =>
      request<Paginated<AkunInternal>>(`/company/users?page=${page}&pageSize=${pageSize}`),
    create: (input: { nama: string; email: string; role: AkunInternalRole }) =>
      request<{ data: AkunInternal }>('/company/users', { method: 'POST', body: JSON.stringify(input) }),
    updateRole: (id: string, role: AkunInternalRole) =>
      request<{ data: AkunInternal }>(`/company/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    remove: (id: string) => request<{ data: unknown }>(`/company/users/${id}`, { method: 'DELETE' }),
  },

  emergencyUnlockLog: {
    list: (page: number, pageSize = 25) =>
      request<Paginated<EmergencyUnlockLogRow>>(`/company/emergency-unlock-log?page=${page}&pageSize=${pageSize}`),
    create: (input: { lokerId: string; catatan?: string; waktuKejadian: string }) =>
      request<{ data: unknown }>('/company/emergency-unlock-log', { method: 'POST', body: JSON.stringify(input) }),
  },

  aktivitas: {
    list: (page: number, pageSize = 25, kategori?: LogKategori) =>
      request<Paginated<LogAktivitasRow>>(
        `/company/aktivitas?page=${page}&pageSize=${pageSize}${kategori ? `&kategori=${kategori}` : ''}`,
      ),
  },

  /** Fitur member RFID/kode unik (di luar cakupan PRD awal) — cuma Super Admin, lihat member.controller.ts. */
  members: {
    list: (page: number, pageSize = 25, mitraId?: string) =>
      request<Paginated<MemberRow>>(
        `/company/members?page=${page}&pageSize=${pageSize}${mitraId ? `&mitraId=${mitraId}` : ''}`,
      ),
    create: (input: CreateMemberInput) =>
      request<{ data: MemberRow }>('/company/members', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: UpdateMemberInput) =>
      request<{ data: MemberRow }>(`/company/members/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    remove: (id: string) => request<{ data: unknown }>(`/company/members/${id}`, { method: 'DELETE' }),
  },
};
