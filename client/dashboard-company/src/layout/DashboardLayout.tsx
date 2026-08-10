import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, type SidebarItem } from '@smartbox/ui';
import { useAuth } from '../auth/AuthContext';
import type { AkunInternalRole } from '../api/client';

const NAV_ITEMS: SidebarItem[] = [
  { section: 'Utama' },
  { id: '/', label: 'Overview', icon: 'layout-grid' },
  { id: '/units', label: 'Unit Locker', icon: 'package' },
  { section: 'Partner' },
  { id: '/partner', label: 'Mitra & Skema', icon: 'building-2' },
  { section: 'Laporan' },
  { id: '/laporan/transaksi', label: 'Transaksi', icon: 'receipt' },
  { id: '/laporan/bagi-hasil', label: 'Bagi Hasil', icon: 'chart-column' },
  { section: 'Admin' },
  { id: '/users', label: 'Manajemen User', icon: 'users' },
  { id: '/emergency-unlock', label: 'Emergency Unlock', icon: 'key-round' },
  { id: '/aktivitas', label: 'Aktivitas', icon: 'activity' },
];

/**
 * Cocok dengan `@Roles(...)` masing-masing endpoint GET di backend (§5) —
 * kalau role login tidak ada di daftar ini, jangan tampilkan link-nya sama
 * sekali di sidebar (dead-end 403 lebih buruk daripada link disembunyikan).
 * Route tanpa entri di sini = terbuka untuk semua role internal.
 *
 * STAFF sengaja TIDAK ada di `/emergency-unlock` walau boleh POST
 * (catat kejadian) — GET listnya SUPER_ADMIN/OPS only di backend. Halaman
 * itu sendiri yang menyesuaikan tampilan untuk STAFF (lihat
 * EmergencyUnlockPage.tsx), bukan disembunyikan total, supaya STAFF tetap
 * bisa mencatat.
 */
const ROLE_RESTRICTED: Partial<Record<string, AkunInternalRole[]>> = {
  '/': ['SUPER_ADMIN', 'OPS', 'MANAGER'],
  '/units': ['SUPER_ADMIN', 'OPS'],
  '/units/:id': ['SUPER_ADMIN', 'OPS'],
  '/partner': ['SUPER_ADMIN', 'OPS', 'MANAGER'],
  '/laporan/transaksi': ['SUPER_ADMIN', 'OPS', 'MANAGER'],
  '/laporan/bagi-hasil': ['SUPER_ADMIN', 'OPS', 'MANAGER'],
  '/users': ['SUPER_ADMIN'],
  '/emergency-unlock': ['SUPER_ADMIN', 'OPS', 'STAFF'],
  '/aktivitas': ['SUPER_ADMIN', 'OPS', 'MANAGER'],
};

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = NAV_ITEMS.filter((it) => {
    if ('section' in it) return true;
    const allowed = ROLE_RESTRICTED[it.id];
    if (!allowed) return true;
    return !!profile && allowed.includes(profile.role);
  });

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--sl-surface-page)' }}>
      <Sidebar
        items={items}
        activeId={location.pathname}
        onSelect={(id) => navigate(id)}
        footer={
          <div>
            <div style={{ fontWeight: 'var(--sl-fw-semibold)', color: '#fff' }}>{profile?.nama}</div>
            <div>{profile?.role}</div>
            <button
              type="button"
              onClick={() => void signOut()}
              style={{ marginTop: 8, background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
            >
              Keluar
            </button>
          </div>
        }
      />
      <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--sl-space-8)' }}>
        <Outlet />
      </main>
    </div>
  );
}
