import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';
import { DashboardLayout } from './layout/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { UnitsPage } from './pages/UnitsPage';
import { UnitDetailPage } from './pages/UnitDetailPage';
import { PartnerPage } from './pages/PartnerPage';
import { MitraDetailPage } from './pages/MitraDetailPage';
import { LaporanTransaksiPage } from './pages/LaporanTransaksiPage';
import { LaporanBagiHasilPage } from './pages/LaporanBagiHasilPage';
import { UsersPage } from './pages/UsersPage';
import { EmergencyUnlockPage } from './pages/EmergencyUnlockPage';
import { AktivitasPage } from './pages/AktivitasPage';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { session, profile, loading, error } = useAuth();
  const { t } = useTranslation();

  if (loading) return <FullPageMessage text={t('common.memuat')} />;
  if (!session) return <Navigate to="/login" replace />;
  if (error || !profile) return <FullPageMessage text={error ?? t('app.akunTidakDikenali')} />;

  return children;
}

function FullPageMessage({ text }: { text: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sl-font-body)', color: 'var(--sl-text-muted)' }}>
      {text}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<OverviewPage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/units/:id" element={<UnitDetailPage />} />
          <Route path="/partner" element={<PartnerPage />} />
          <Route path="/partner/:id" element={<MitraDetailPage />} />
          <Route path="/laporan/transaksi" element={<LaporanTransaksiPage />} />
          <Route path="/laporan/bagi-hasil" element={<LaporanBagiHasilPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/emergency-unlock" element={<EmergencyUnlockPage />} />
          <Route path="/aktivitas" element={<AktivitasPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
