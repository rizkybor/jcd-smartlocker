import { useTranslation } from 'react-i18next';
import { KioskButton, Numpad } from '@smartbox/ui';
import { KioskShell, sewaSteps } from './KioskShell';

/**
 * Dipakai ulang oleh dua alur (Sewa langkah 1, Ambil Barang langkah 1) —
 * `steps`/`title`/`subtitle` dikirim caller (App.tsx) supaya step bar &
 * copy sesuai konteksnya masing-masing.
 */
export function NomorHpScreen({
  nomorHp,
  onChange,
  onLanjut,
  onKembali,
  valid,
  steps,
  title,
  subtitle,
}: {
  nomorHp: string;
  onChange: (value: string) => void;
  onLanjut: () => void;
  onKembali: () => void;
  valid: boolean;
  steps?: string[];
  title?: string;
  subtitle?: string;
}) {
  const { t } = useTranslation();
  return (
    <KioskShell
      step={0}
      steps={steps ?? sewaSteps()}
      title={title ?? t('nomorHp.sewa.title')}
      subtitle={subtitle ?? t('nomorHp.sewa.subtitle')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--sl-space-6)' }}>
        <Numpad value={nomorHp} onChange={onChange} length={13} />
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
