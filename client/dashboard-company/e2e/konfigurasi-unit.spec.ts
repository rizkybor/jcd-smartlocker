import { test, expect } from '@playwright/test';
import { mockLogin, mockOverview, mockUnitConfigFlow } from './mocks';

/**
 * SMB-1104 — konfigurasi unit (§5.4): Super Admin ubah varian kompartemen
 * & simpan, verifikasi pesan "Tersimpan." muncul.
 */
test('Super Admin mengubah konfigurasi unit', async ({ page }) => {
  await mockLogin(page, 'SUPER_ADMIN');
  await mockOverview(page);
  await mockUnitConfigFlow(page);
  await page.goto('/login');

  await page.getByLabel('Email').fill('admin@e2e.test');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Masuk' }).click();

  await expect(page.getByRole('button', { name: 'Unit Locker' })).toBeVisible();
  await page.getByRole('button', { name: 'Unit Locker' }).click();

  await expect(page.getByText('UNIT-E2E')).toBeVisible();
  await page.getByText('UNIT-E2E').click();

  await expect(page.getByRole('heading', { name: 'Konfigurasi' })).toBeVisible();
  const varian = page.getByLabel('Varian Kompartemen');
  await varian.fill('Besar');
  await page.getByRole('button', { name: 'Simpan Konfigurasi' }).click();

  await expect(page.getByText('Tersimpan.')).toBeVisible();
});
