import { defineConfig, devices } from '@playwright/test';

/**
 * SMB-1103 — E2E alur kiosk penuh (sewa & ambil barang), viewport
 * 600×1024 (portrait, sama seperti kanvas kiosk sungguhan, lihat App.tsx).
 * Semua request `/kiosk/*` di-mock lewat page.route() (e2e/mocks.ts) — TIDAK
 * butuh backend/DB sungguhan berjalan, supaya stabil di CI & tidak
 * bergantung pada webhook pembayaran QRIS asli yang tidak bisa dipicu
 * otomatis dalam test.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5273',
    viewport: { width: 600, height: 1024 },
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Port KHUSUS E2E (bukan 5173, port dev normal) — supaya tidak pernah
    // ikut "reuse" server dev manual yang mungkin sudah jalan di 5173 tanpa
    // .env.e2e (ditemukan langsung: mock page.route() tidak pernah kena
    // kalau webServer nyasar reuse server lain yang base URL-nya beda).
    command: 'npx vite dev --mode e2e --port 5273',
    port: 5273,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
