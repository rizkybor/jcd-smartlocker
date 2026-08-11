import type { Page } from '@playwright/test';

const API_BASE = 'http://localhost:4010';
const SUPABASE_BASE = 'http://localhost:4011';

function json(data: unknown) {
  return { data };
}

function paginated(data: unknown[]) {
  return { data, meta: { page: 1, pageSize: 25, totalItems: data.length, totalPages: 1 } };
}

export type Role = 'SUPER_ADMIN' | 'OPS' | 'MANAGER' | 'STAFF';

/**
 * Login Supabase Auth (§9.2, dilakukan langsung dari browser, lihat
 * lib/supabase.ts) — mock respons `POST {SUPABASE_URL}/auth/v1/token` PAS
 * seperti bentuk asli supabase-js supaya SDK menyimpan session valid,
 * lalu `GET /company/me` (backend) dipanggil AuthContext untuk resolve role.
 */
export async function mockLogin(page: Page, role: Role, opts: { nama?: string; email?: string } = {}) {
  const email = opts.email ?? 'admin@e2e.test';
  const nama = opts.nama ?? 'Admin E2E';
  const userId = 'e2e-user-1';

  await page.route(`${SUPABASE_BASE}/auth/v1/token*`, (route) =>
    route.fulfill({
      json: {
        access_token: 'e2e-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'e2e-refresh-token',
        user: {
          id: userId,
          aud: 'authenticated',
          role: 'authenticated',
          email,
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
        },
      },
    }),
  );

  await page.route(`${API_BASE}/company/me`, (route) =>
    route.fulfill({ json: json({ id: 'akun-internal-1', email, nama, role }) }),
  );
}

export async function mockOverview(page: Page) {
  await page.route(`${API_BASE}/company/overview`, (route) =>
    route.fulfill({
      json: json({
        jumlahLokasi: 1,
        jumlahUnit: 1,
        jumlahLoker: 6,
        lokerPerStatus: { tersedia: 5, terisi: 1, maintenance: 0, offline: 0, nonaktif: 0 },
        okupansiPersen: 16.7,
        pendapatanTotal: 50_000,
        unitOnline: 1,
        unitOffline: 0,
      }),
    }),
  );
}

const lokasiE2E = { id: 'lokasi-1', nama: 'Lokasi E2E', alamat: 'Jl. Contoh No. 1', timezone: 'Asia/Jakarta' };
const mitraLokasiE2E = { id: 'ml-1', mitraId: 'mitra-1', lokasiId: 'lokasi-1', tipeSkema: 'REVENUE_SHARING' as const, persentaseAktif: 20, lokasi: lokasiE2E };
const mitraE2E = { id: 'mitra-1', nama: 'Mitra E2E', kontak: '08123456789', deletedAt: null, createdAt: new Date().toISOString(), mitraLokasi: [mitraLokasiE2E] };

/** Alur approval Manager (§10, §12 poin 2) — PartnerPage -> MitraDetailPage -> SkemaHistoriPanel. */
export async function mockApprovalFlow(page: Page) {
  await page.route(`${API_BASE}/company/mitra?**`, (route) => route.fulfill({ json: paginated([mitraE2E]) }));
  await page.route(`${API_BASE}/company/mitra/mitra-1`, (route) => route.fulfill({ json: json(mitraE2E) }));

  const historiPending = {
    id: 'histori-1',
    mitraLokasiId: 'ml-1',
    persentase: 25,
    statusApproval: 'PENDING',
    diajukanOleh: 'Super Admin E2E',
    disetujuiOleh: null,
    diajukanAt: new Date().toISOString(),
    disetujuiAt: null,
    berlakuDari: null,
    berlakuSampai: null,
  };
  let approved = false;
  await page.route(`${API_BASE}/company/mitra-lokasi/ml-1/skema-histori`, (route) =>
    route.fulfill({
      json: json(
        approved
          ? [{ ...historiPending, statusApproval: 'APPROVED', disetujuiOleh: 'Manager E2E', disetujuiAt: new Date().toISOString(), berlakuDari: new Date().toISOString() }]
          : [historiPending],
      ),
    }),
  );
  await page.route(`${API_BASE}/company/skema-histori/histori-1/approve`, (route) => {
    approved = true;
    return route.fulfill({ json: json({ ...historiPending, statusApproval: 'APPROVED' }) });
  });
}

/** Provisioning Super Admin — UsersPage + CreateUserDialog. */
export async function mockUsersFlow(page: Page) {
  const existing = { id: 'akun-internal-1', nama: 'Admin E2E', email: 'admin@e2e.test', role: 'SUPER_ADMIN', deletedAt: null, createdAt: new Date().toISOString() };
  const created: { id: string; nama: string; email: string; role: string; deletedAt: null; createdAt: string }[] = [];

  await page.route(`${API_BASE}/company/users?**`, (route) => route.fulfill({ json: paginated([existing, ...created]) }));
  await page.route(`${API_BASE}/company/users`, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON() as { nama: string; email: string; role: string };
    const user = { id: `akun-internal-${created.length + 2}`, ...body, deletedAt: null, createdAt: new Date().toISOString() };
    created.push(user);
    return route.fulfill({ json: json(user) });
  });
}

/** Konfigurasi unit — UnitsPage -> UnitDetailPage -> update durasi & harga. */
export async function mockUnitConfigFlow(page: Page) {
  const unitList = {
    id: 'unit-1',
    lokasiId: 'lokasi-1',
    kodeUnit: 'UNIT-E2E',
    varianKompartemen: 'Sedang',
    jumlahLoker: 2,
    modePemakaian: 'BERBAYAR',
    aktif: true,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    lokasi: { ...lokasiE2E, mitraLokasi: [{ id: 'ml-1', mitraId: 'mitra-1', tipeSkema: 'REVENUE_SHARING', mitra: { id: 'mitra-1', nama: 'Mitra E2E', kontak: null } }] },
    lokers: [
      { id: 'loker-1', unitId: 'unit-1', lokerKategoriId: 'kategori-1', nomorLoker: '01', status: 'TERSEDIA' },
      { id: 'loker-2', unitId: 'unit-1', lokerKategoriId: 'kategori-1', nomorLoker: '02', status: 'TERISI', overdueStatus: null },
    ],
    durasiHarga: [{ id: 'durasi-1', unitId: 'unit-1', lokerKategoriId: 'kategori-1', durasiJam: 1, harga: 5000, aktif: true }],
    lokerKategori: [{ id: 'kategori-1', unitId: 'unit-1', nama: 'Standar', ukuranWMm: null, ukuranHMm: null, aktif: true }],
  };

  await page.route(`${API_BASE}/company/units?**`, (route) => route.fulfill({ json: paginated([unitList]) }));
  await page.route(`${API_BASE}/company/units/unit-1`, async (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({ json: json(unitList) });
    }
    return route.fulfill({ json: json({ ...unitList, riwayatTransaksi: [] }) });
  });
}
