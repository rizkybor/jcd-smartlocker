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
    baseURL: 'http://localhost:5173',
    viewport: { width: 600, height: 1024 },
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite dev --mode e2e --port 5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
