import { useTranslation } from 'react-i18next';
import { KioskButton, Numpad } from '@smartbox/ui';
import { KioskShell, ambilSteps } from './KioskShell';

/** Alur Ambil Barang langkah 3 (§5.2) — kode OTP 6 digit, berlaku 5 menit. */
export function OtpScreen({
  kode,
  onChange,
  onVerifikasi,
  onKirimUlang,
  onKembali,
  valid,
  errorMessage,
}: {
  kode: string;
  onChange: (value: string) => void;
  onVerifikasi: () => void;
  onKirimUlang: () => void;
  onKembali: () => void;
  valid: boolean;
  errorMessage: string | null;
}) {
  const { t } = useTranslation();
  return (
    <KioskShell step={1} steps={ambilSteps()} title={t('otp.title')} subtitle={t('otp.subtitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--sl-space-6)' }}>
        <Numpad value={kode} onChange={onChange} length={6} />
        {errorMessage ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--sl-status-offline-strong)',
              fontFamily: 'var(--sl-font-body)',
              fontSize: 'var(--sl-kiosk-fs-caption)',
            }}
          >
            {errorMessage}
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 'var(--sl-space-4)' }}>
          <KioskButton tone="neutral" size="md" onClick={onKembali}>
            {t('common.kembali')}
          </KioskButton>
          <KioskButton tone="primary" size="lg" disabled={!valid} onClick={onVerifikasi}>
            {t('otp.verifikasi')}
          </KioskButton>
        </div>
        <KioskButton tone="neutral" size="md" onClick={onKirimUlang}>
          {t('otp.kirimUlang')}
        </KioskButton>
      </div>
    </KioskShell>
  );
}
