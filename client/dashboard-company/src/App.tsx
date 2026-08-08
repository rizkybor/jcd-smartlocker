import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';
import { DashboardLayout } from './layout/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ComingSoonPage } from './pages/ComingSoonPage';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { session, profile, loading, error } = useAuth();

  if (loading) return <FullPageMessage text="Memuat..." />;
  if (!session) return <Navigate to="/login" replace />;
  if (error || !profile) return <FullPageMessage text={error ?? 'Akun tidak dikenali.'} />;

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
          <Route path="/units" element={<ComingSoonPage title="Unit Locker" />} />
          <Route path="/partner" element={<ComingSoonPage title="Mitra & Skema" />} />
          <Route path="/laporan/transaksi" element={<ComingSoonPage title="Laporan Transaksi" />} />
          <Route path="/laporan/bagi-hasil" element={<ComingSoonPage title="Laporan Bagi Hasil" />} />
          <Route path="/users" element={<ComingSoonPage title="Manajemen User" />} />
          <Route path="/emergency-unlock" element={<ComingSoonPage title="Emergency Unlock" />} />
          <Route path="/aktivitas" element={<ComingSoonPage title="Aktivitas" />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
