import { test, expect } from '@playwright/test';
import { mockLogin, mockOverview, mockApprovalFlow } from './mocks';

/**
 * SMB-1104 — approval Manager atas persentase revenue sharing (§10, §12
 * poin 2): login sebagai MANAGER -> buka Mitra & Skema -> approve
 * pengajuan persentase PENDING.
 */
test('Manager approve pengajuan persentase revenue sharing', async ({ page }) => {
  await mockLogin(page, 'MANAGER', { nama: 'Manager E2E' });
  await mockOverview(page);
  await mockApprovalFlow(page);
  await page.goto('/login');

  await page.getByLabel('Email').fill('manager@e2e.test');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Masuk' }).click();

  await expect(page.getByRole('button', { name: 'Mitra & Skema' })).toBeVisible();
  await page.getByRole('button', { name: 'Mitra & Skema' }).click();

  await expect(page.getByText('Mitra E2E')).toBeVisible();
  await page.getByText('Mitra E2E').click();

  await expect(page.getByText('PENDING')).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).click();

  await expect(page.getByText('APPROVED')).toBeVisible();
});
