import { test, expect } from '@playwright/test';
import { mockAmbilFlow } from './mocks';

/**
 * SMB-1103 — cabang overdue/denda/suspend pada alur ambil barang (fitur di
 * luar PRD awal, lihat server/backend/src/common/overdue.util.ts).
 */
test('sesi disuspend (>=24 jam telat) -> layar hubungi admin, tidak ada opsi bayar', async ({ page }) => {
  await mockAmbilFlow(page, { suspended: true });
  await page.goto('/');

  await page.getByText('Sentuh untuk Sewa Loker').click();
  await page.getByRole('button', { name: 'Ambil Barang' }).click();
  for (const digit of '081234567890') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Lanjut' }).click();

  await expect(page.getByText('Loker Disuspend')).toBeVisible();
  await expect(page.getByText(/hubungi petugas\/admin/i)).toBeVisible();

  await page.getByRole('button', { name: 'Kembali' }).click();
  await expect(page.getByText('Sentuh untuk Sewa Loker')).toBeVisible();
});

test('sesi overdue (<24 jam) -> layar bayar denda muncul dengan jam terlambat', async ({ page }) => {
  await mockAmbilFlow(page, { overdue: true });
  await page.goto('/');

  await page.getByText('Sentuh untuk Sewa Loker').click();
  await page.getByRole('button', { name: 'Ambil Barang' }).click();
  for (const digit of '081234567890') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Lanjut' }).click();

  await expect(page.getByText('Bayar Denda Keterlambatan')).toBeVisible();
  await expect(page.getByText('Terlambat 2 jam dari waktu selesai sewa — scan untuk bayar kekurangan.')).toBeVisible();
});
