import { test, expect } from '@playwright/test';
import { mockSewaFlow } from './mocks';

/**
 * SMB-1103 — alur sewa penuh (§5.1): idle -> menu -> nomor HP -> email ->
 * durasi -> bayar QR -> buka pintu -> struk. API di-mock (lihat mocks.ts).
 */
test('alur sewa loker berhasil sampai struk', async ({ page }) => {
  await mockSewaFlow(page);
  await page.goto('/');

  await page.getByText('Sentuh untuk Sewa Loker').click();
  await page.getByRole('button', { name: 'Sewa Loker' }).click();

  // Nomor HP
  for (const digit of '081234567890') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Lanjut' }).click();

  // Email — input native, bukan Numpad
  await page.getByPlaceholder('nama@email.com').fill('penyewa@example.com');
  await page.getByRole('button', { name: 'Lanjut' }).click();

  // Durasi
  await expect(page.getByText('Pilih Durasi Sewa')).toBeVisible();
  await page.getByText('1 jam').click();

  // Bayar — tunggu QR muncul, lalu polling status otomatis jadi PAID (mock)
  await expect(page.getByText('Scan untuk Bayar')).toBeVisible();

  // bukaPintu (transisi otomatis) -> struk
  await expect(page.getByText('Loker Siap Dipakai')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('ID Transaksi: SB-E2E1')).toBeVisible();
  await expect(page.getByText('Loker 01')).toBeVisible();

  await page.getByRole('button', { name: 'Selesai' }).click();
  await expect(page.getByText('Sentuh untuk Sewa Loker')).toBeVisible();
});
