import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Field, Button, Panel } from '@smartbox/ui';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { t } = useTranslation();
  const { session, profile, signIn, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (session && profile) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      // Ditangani via `error` dari context (pesan asli Supabase).
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
            {t('login.judul')}
          </div>
          <div style={{ marginTop: 4, fontSize: 'var(--sl-fs-13)', color: 'var(--sl-text-muted)' }}>{t('login.subjudul')}</div>
        </div>
        <Panel>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
            <Field label={t('login.email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Field label={t('login.password')} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            {error ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-offline-strong)' }}>{error}</div> : null}
            <Button type="submit" tone="primary" fullWidth disabled={submitting || !email || !password}>
              {submitting ? t('login.sedangMasuk') : t('login.masuk')}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
