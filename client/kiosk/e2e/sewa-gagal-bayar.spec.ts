import { test, expect } from '@playwright/test';
import { mockSewaFlow } from './mocks';

/**
 * SMB-1103 — skenario gagal bayar/timeout (§5.1 langkah 5): QR kedaluwarsa
 * -> layar bayarGagal -> "Coba Lagi" kembali ke pilihan durasi.
 */
test('QR kedaluwarsa -> layar gagal bayar -> coba lagi kembali ke durasi', async ({ page }) => {
  await mockSewaFlow(page, { statusBayarAkhir: 'EXPIRED' });
  await page.goto('/');

  await page.getByText('Sentuh untuk Sewa Loker').click();
  await page.getByRole('button', { name: 'Sewa Loker' }).click();
  for (const digit of '081234567890') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await page.getByPlaceholder('nama@email.com').fill('penyewa@example.com');
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await page.getByText('1 jam').click();

  await expect(page.getByText('Scan untuk Bayar')).toBeVisible();

  await expect(page.getByText('QR Sudah Kedaluwarsa')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Coba Lagi' }).click();
  await expect(page.getByText('Pilih Durasi Sewa')).toBeVisible();
});

test('QR kedaluwarsa -> Batalkan kembali ke idle', async ({ page }) => {
  await mockSewaFlow(page, { statusBayarAkhir: 'EXPIRED' });
  await page.goto('/');

  await page.getByText('Sentuh untuk Sewa Loker').click();
  await page.getByRole('button', { name: 'Sewa Loker' }).click();
  for (const digit of '081234567890') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await page.getByPlaceholder('nama@email.com').fill('penyewa@example.com');
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await page.getByText('1 jam').click();

  await expect(page.getByText('QR Sudah Kedaluwarsa')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Batalkan' }).click();
  await expect(page.getByText('Sentuh untuk Sewa Loker')).toBeVisible();
});
