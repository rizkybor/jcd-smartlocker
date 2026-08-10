import { test, expect } from '@playwright/test';
import { mockAmbilFlow } from './mocks';

/**
 * SMB-1103 — alur ambil barang penuh (§5.2): nomor HP -> kirim OTP ->
 * verifikasi OTP -> buka pintu -> selesai. API di-mock (lihat mocks.ts).
 */
test('alur ambil barang berhasil sampai selesai', async ({ page }) => {
  await mockAmbilFlow(page);
  await page.goto('/');

  await page.getByText('Sentuh untuk Sewa Loker').click();
  await page.getByRole('button', { name: 'Ambil Barang' }).click();

  for (const digit of '081234567890') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Lanjut' }).click();

  await expect(page.getByText('Masukkan Kode OTP')).toBeVisible();
  for (const digit of '123456') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Verifikasi' }).click();

  await expect(page.getByText('Silakan ambil barang Anda')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Selesai' }).click();
  await expect(page.getByText('Sentuh untuk Sewa Loker')).toBeVisible();
});

test('kode OTP salah -> tetap di layar OTP dengan pesan error', async ({ page }) => {
  await mockAmbilFlow(page);
  await page.goto('/');

  await page.getByText('Sentuh untuk Sewa Loker').click();
  await page.getByRole('button', { name: 'Ambil Barang' }).click();
  for (const digit of '081234567890') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Lanjut' }).click();

  await expect(page.getByText('Masukkan Kode OTP')).toBeVisible();
  for (const digit of '000000') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Verifikasi' }).click();

  await expect(page.getByText('Kode OTP salah atau sudah kedaluwarsa.')).toBeVisible();
});
