import { defineConfig, devices } from '@playwright/test';

/**
 * SMB-1104 — E2E Dashboard Company (approval Manager, provisioning Super
 * Admin, konfigurasi unit). Login Supabase Auth & panggilan `/company/*`
 * di-mock lewat page.route() (e2e/mocks.ts) — TIDAK butuh project Supabase
 * atau backend sungguhan berjalan, supaya stabil di CI.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite dev --mode e2e --port 5174',
    port: 5174,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
