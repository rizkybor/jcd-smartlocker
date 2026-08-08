import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Field, Button, Panel } from '@smartbox/ui';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { session, profile, signIn, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AuthProvider membungkus semua route termasuk /login, jadi selalu cek
  // session tersimpan di localStorage begitu app dimuat — kalau ternyata
  // masih login (session+profile valid), jangan tampilkan form login lagi,
  // langsung ke dashboard.
  if (session && profile) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Pesan error asli (dari Supabase, lewat AuthContext.signIn) sudah
      // ke-set ke `error` di context SEBELUM signIn() throw — cukup
      // biarkan render itu, jangan ditimpa teks generik yang menyamarkan
      // penyebab sungguhan (ditemukan langsung: dulu di sini selalu
      // menampilkan "periksa kembali email/password" apa pun error-nya).
      await signIn(email, password);
    } catch {
      // Ditangani via `error` dari context, lihat komentar di atas.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--sl-surface-page)',
        fontFamily: 'var(--sl-font-body)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--sl-space-6)' }}>
          <div style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
            Sewa Smart Locker
          </div>
          <div style={{ marginTop: 4, fontSize: 'var(--sl-fs-13)', color: 'var(--sl-text-muted)' }}>Dashboard Company</div>
        </div>
        <Panel>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
            <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Field label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            {error ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-offline-strong)' }}>{error}</div> : null}
            <Button type="submit" tone="primary" fullWidth disabled={submitting || !email || !password}>
              {submitting ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
