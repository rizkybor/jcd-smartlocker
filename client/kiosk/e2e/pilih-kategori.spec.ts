import { test, expect } from '@playwright/test';
import { mockSewaFlow } from './mocks';

/**
 * SMB-1103 — fitur harga & pilihan per ukuran loker (di luar cakupan PRD
 * awal): kategori dengan `jumlahTersedia === 0` (mock: "Besar") harus
 * tampil TAPI disabled, tidak bisa dipilih, sementara kategori tersedia
 * (mock: "Kecil") tetap bisa diklik lanjut ke pilihan durasi.
 */
test('kategori loker penuh ditampilkan disabled, tidak bisa dipilih', async ({ page }) => {
  await mockSewaFlow(page);
  await page.goto('/');

  await page.getByText('Sentuh untuk Sewa Loker').click();
  await page.getByRole('button', { name: 'Sewa Loker' }).click();
  for (const digit of '081234567890') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await page.getByPlaceholder('nama@email.com').fill('penyewa@example.com');
  await page.getByRole('button', { name: 'Lanjut' }).click();

  await expect(page.getByText('Pilih Ukuran Loker')).toBeVisible();

  const kategoriBesar = page.getByRole('button', { name: /Besar/ });
  await expect(kategoriBesar).toBeVisible();
  await expect(kategoriBesar).toBeDisabled();
  await expect(page.getByText('Penuh')).toBeVisible();

  const kategoriKecil = page.getByRole('button', { name: /Kecil/ });
  await expect(kategoriKecil).toBeEnabled();
  await expect(page.getByText('3 tersedia')).toBeVisible();

  await kategoriKecil.click();
  await expect(page.getByText('Pilih Durasi Sewa')).toBeVisible();
  // Kategori "Besar" cuma punya tarif 1 jam = Rp15.000 (tidak dipilih) —
  // yang tampil harus tarif "Kecil" (1 jam & 3 jam).
  await expect(page.getByText('1 jam')).toBeVisible();
  await expect(page.getByText('3 jam')).toBeVisible();
});

test('tombol Kembali dari layar kategori balik ke layar email', async ({ page }) => {
  await mockSewaFlow(page);
  await page.goto('/');

  await page.getByText('Sentuh untuk Sewa Loker').click();
  await page.getByRole('button', { name: 'Sewa Loker' }).click();
  for (const digit of '081234567890') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await page.getByPlaceholder('nama@email.com').fill('penyewa@example.com');
  await page.getByRole('button', { name: 'Lanjut' }).click();

  await expect(page.getByText('Pilih Ukuran Loker')).toBeVisible();
  await page.getByRole('button', { name: 'Kembali' }).click();
  await expect(page.getByText('Masukkan Email Anda')).toBeVisible();
});
