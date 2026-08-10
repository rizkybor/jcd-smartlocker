import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';
import { DashboardLayout } from './layout/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { UnitsPage } from './pages/UnitsPage';
import { LaporanPage } from './pages/LaporanPage';

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
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/laporan" element={<LaporanPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
