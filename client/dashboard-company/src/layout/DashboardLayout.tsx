import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, type SidebarItem } from '@smartbox/ui';
import { useAuth } from '../auth/AuthContext';

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

/** Item nav yang butuh role SUPER_ADMIN — disembunyikan dari role lain (§5.4), penegakan sungguhan tetap di backend guard. */
const SUPER_ADMIN_ONLY = new Set(['/users']);

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = NAV_ITEMS.filter((it) => {
    if ('section' in it) return true;
    if (SUPER_ADMIN_ONLY.has(it.id) && profile?.role !== 'SUPER_ADMIN') return false;
    return true;
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
