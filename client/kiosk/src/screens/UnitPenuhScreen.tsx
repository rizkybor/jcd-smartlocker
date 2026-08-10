import { useTranslation } from 'react-i18next';
import { KioskButton } from '@smartbox/ui';

export function UnitPenuhScreen({ onKembali }: { onKembali: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 'var(--sl-space-6)',
        fontFamily: 'var(--sl-font-display)',
        textAlign: 'center',
        padding: 'var(--sl-kiosk-pad)',
      }}
    >
      <div style={{ fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
        {t('unitPenuh.judul')}
      </div>
      <div style={{ fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-kiosk-fs-body)', color: 'var(--sl-text-muted)', maxWidth: 600 }}>
        {t('unitPenuh.detail')}
      </div>
      <KioskButton tone="neutral" size="lg" onClick={onKembali}>
        {t('common.kembali')}
      </KioskButton>
    </div>
  );
}
