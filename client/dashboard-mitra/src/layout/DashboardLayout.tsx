import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar, type SidebarItem } from '@smartbox/ui';
import { useAuth } from '../auth/AuthContext';

/**
 * Tidak ada filter per-role di sini seperti Dashboard Company — cuma satu
 * jenis akun (AkunMitra), semua route sama-sama read-only & terbuka untuk
 * mitra yang login (§5.5).
 */
export function DashboardLayout() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: SidebarItem[] = [
    { section: t('sidebar.utama') },
    { id: '/', label: t('sidebar.overview'), icon: 'layout-grid' },
    { id: '/units', label: t('sidebar.unitLocker'), icon: 'package' },
    { id: '/laporan', label: t('sidebar.laporan'), icon: 'receipt' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--sl-surface-page)' }}>
      <Sidebar
        items={navItems}
        activeId={location.pathname}
        onSelect={(id) => navigate(id)}
        footer={
          <div>
            <div style={{ fontWeight: 'var(--sl-fw-semibold)', color: '#fff' }}>{profile?.nama}</div>
            <div>{profile?.mitraNama}</div>
            <button
              type="button"
              onClick={() => void signOut()}
              style={{ marginTop: 8, background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
            >
              {t('common.keluar')}
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
