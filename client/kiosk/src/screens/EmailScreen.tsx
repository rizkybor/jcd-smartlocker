import { useTranslation } from 'react-i18next';
import { KioskButton } from '@smartbox/ui';
import { KioskShell } from './KioskShell';

/**
 * Layar khusus alur Sewa — TIDAK dipakai alur Ambil Barang. Wajib
 * SEMENTARA karena OTP ambil-barang lewat channel email/Brevo selama
 * WhatsApp BSP belum tersedia (lihat mulai-sewa.dto.ts backend). Input
 * native (bukan Numpad kustom) — mengandalkan keyboard on-screen OS Mini
 * PC kiosk untuk entri alfanumerik (§9.1 hardware).
 */
export function EmailScreen({
  email,
  onChange,
  onLanjut,
  onKembali,
  valid,
}: {
  email: string;
  onChange: (value: string) => void;
  onLanjut: () => void;
  onKembali: () => void;
  valid: boolean;
}) {
  const { t } = useTranslation();
  return (
    <KioskShell step={1} title={t('email.title')} subtitle={t('email.subtitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--sl-space-6)' }}>
        <input
          type="email"
          inputMode="email"
          autoFocus
          value={email}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('email.placeholder')}
          style={{
            width: '100%',
            maxWidth: 480,
            height: 'var(--sl-touch-min)',
            padding: '0 var(--sl-space-5)',
            fontFamily: 'var(--sl-font-body)',
            fontSize: 'var(--sl-kiosk-fs-body)',
            color: 'var(--sl-text-strong)',
            background: 'var(--sl-n-0)',
            border: 'var(--sl-border-w-kiosk) solid var(--sl-border-kiosk)',
            borderRadius: 'var(--sl-radius-md)',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        />
        <div style={{ display: 'flex', gap: 'var(--sl-space-4)' }}>
          <KioskButton tone="neutral" size="md" onClick={onKembali}>
            {t('common.kembali')}
          </KioskButton>
          <KioskButton tone="primary" size="lg" disabled={!valid} onClick={onLanjut}>
            {t('common.lanjut')}
          </KioskButton>
        </div>
      </div>
    </KioskShell>
  );
}
