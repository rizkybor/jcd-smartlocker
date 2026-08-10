import type { Page } from '@playwright/test';

const API_BASE = 'http://localhost:4010';

function json(data: unknown) {
  return { data };
}

function errorEnvelope(code: string, message: string) {
  return { error: { code, message } };
}

/** Dipanggil App.tsx saat startup (state `muatUnit`) sebelum layar apa pun tampil — wajib dipasang di SEMUA test, bukan cuma alur sewa. */
export async function mockUnitStatus(page: Page) {
  await page.route(`${API_BASE}/kiosk/unit/status`, (route) =>
    route.fulfill({
      json: json({
        kodeUnit: 'UNIT-E2E',
        modePemakaian: 'BERBAYAR',
        unitPenuh: false,
        jumlahTersedia: 3,
        jumlahTotal: 6,
        durasiHarga: [
          { id: 'durasi-1', durasiJam: 1, harga: 5000 },
          { id: 'durasi-3', durasiJam: 3, harga: 12000 },
        ],
      }),
    }),
  );
}

export type SewaMockOptions = {
  /** 'PAID' (default) selesai bayar sukses, 'EXPIRED' -> alur bayarGagal (SMB-1103 skenario timeout). */
  statusBayarAkhir?: 'PAID' | 'EXPIRED';
};

/** Mock lengkap alur SEWA (§5.1) — dipasang sebelum navigasi ke halaman kiosk. */
export async function mockSewaFlow(page: Page, opts: SewaMockOptions = {}) {
  const statusBayarAkhir = opts.statusBayarAkhir ?? 'PAID';

  await mockUnitStatus(page);

  await page.route(`${API_BASE}/kiosk/sewa/validasi-hp`, (route) => route.fulfill({ json: json({ valid: true }) }));

  await page.route(`${API_BASE}/kiosk/sewa/mulai`, (route) =>
    route.fulfill({ json: json({ id: 'sesi-e2e-1', idTransaksi: 'SB-E2E1', statusBayar: 'PENDING' }) }),
  );

  await page.route(`${API_BASE}/kiosk/sewa/sesi-e2e-1/bayar`, (route) =>
    route.fulfill({
      json: json({ qrString: '00020101021226-e2e-qr-string', expiredAt: new Date(Date.now() + 300_000).toISOString(), nominal: 5000 }),
    }),
  );

  // Poll status bayar — pertama kali PENDING, panggilan berikutnya balas status akhir
  // (tepat seperti pollStatusBayar di sewaMachine.ts yang polling tiap 2 detik).
  let statusCallCount = 0;
  await page.route(`${API_BASE}/kiosk/sewa/sesi-e2e-1/status`, (route) => {
    statusCallCount += 1;
    const statusBayar = statusCallCount === 1 ? 'PENDING' : statusBayarAkhir;
    return route.fulfill({ json: json({ statusBayar }) });
  });

  await page.route(`${API_BASE}/kiosk/sewa/sesi-e2e-1/buka-pintu`, (route) =>
    route.fulfill({ json: json({ id: 'sesi-e2e-1', idTransaksi: 'SB-E2E1', statusBayar: 'PAID' }) }),
  );

  await page.route(`${API_BASE}/kiosk/sewa/sesi-e2e-1/struk`, (route) =>
    route.fulfill({
      json: json({
        idTransaksi: 'SB-E2E1',
        nomorLoker: '01',
        durasiJam: 1,
        nominal: 5000,
        berlakuSampai: '11 Agustus 2026, 15:00',
      }),
    }),
  );
}

export type AmbilMockOptions = {
  overdue?: boolean;
  suspended?: boolean;
};

/** Mock lengkap alur AMBIL BARANG (§5.2). */
export async function mockAmbilFlow(page: Page, opts: AmbilMockOptions = {}) {
  await mockUnitStatus(page);

  await page.route(`${API_BASE}/kiosk/ambil/mulai`, (route) =>
    route.fulfill({
      json: json({
        id: 'sesi-e2e-ambil-1',
        overdue: !!opts.overdue || !!opts.suspended,
        suspended: !!opts.suspended,
        jamTerlambat: opts.suspended ? 25 : opts.overdue ? 2 : 0,
        dendaNominal: opts.overdue && !opts.suspended ? 10_000 : 0,
      }),
    }),
  );

  await page.route(`${API_BASE}/kiosk/ambil/sesi-e2e-ambil-1/bayar-denda`, (route) =>
    route.fulfill({
      json: json({ qrString: '00020101-e2e-denda-qr', expiredAt: new Date(Date.now() + 300_000).toISOString(), nominal: 10_000, jamTerlambat: 2 }),
    }),
  );
  await page.route(`${API_BASE}/kiosk/ambil/sesi-e2e-ambil-1/status-denda`, (route) =>
    route.fulfill({ json: json({ statusBayar: 'PAID' }) }),
  );

  await page.route(`${API_BASE}/kiosk/ambil/kirim-otp`, (route) => route.fulfill({ json: json({ terkirim: true }) }));

  await page.route(`${API_BASE}/kiosk/ambil/verifikasi-otp`, async (route) => {
    const body = route.request().postDataJSON() as { kode: string };
    if (body.kode === '123456') {
      return route.fulfill({ json: json({ valid: true }) });
    }
    return route.fulfill({ status: 401, json: errorEnvelope('KODE_OTP_SALAH', 'Kode OTP salah atau sudah kedaluwarsa.') });
  });

  await page.route(`${API_BASE}/kiosk/ambil/sesi-e2e-ambil-1/buka-pintu`, (route) =>
    route.fulfill({ json: json({ id: 'sesi-e2e-ambil-1', idTransaksi: 'SB-E2E-AMBIL', statusBayar: 'PAID' }) }),
  );
}
