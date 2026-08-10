import { test, expect } from '@playwright/test';
import { mockLogin, mockOverview, mockUsersFlow } from './mocks';

/**
 * SMB-1104 — provisioning akun internal (§5.4, §7): hanya Super Admin yang
 * boleh membuat akun & menetapkan role (ditegakkan backend, `/users` di
 * sidebar juga cuma tampil untuk SUPER_ADMIN — lihat DashboardLayout.tsx).
 */
test('Super Admin membuat akun internal baru', async ({ page }) => {
  await mockLogin(page, 'SUPER_ADMIN');
  await mockOverview(page);
  await mockUsersFlow(page);
  await page.goto('/login');

  await page.getByLabel('Email').fill('admin@e2e.test');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Masuk' }).click();

  await expect(page.getByRole('button', { name: 'Manajemen User' })).toBeVisible();
  await page.getByRole('button', { name: 'Manajemen User' }).click();

  await expect(page.getByText('Admin E2E')).toBeVisible();
  await page.getByRole('button', { name: '+ Tambah User' }).click();

  await page.getByLabel('Nama').fill('Staff Baru E2E');
  await page.getByLabel('Email').fill('staff.baru@e2e.test');
  await page.getByLabel('Role').selectOption('STAFF');
  await page.getByRole('button', { name: 'Simpan' }).click();

  await expect(page.getByText('Staff Baru E2E')).toBeVisible();
});
