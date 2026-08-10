import { useTranslation } from 'react-i18next';
import { KioskButton } from '@smartbox/ui';

export function MenuScreen({ onSewa, onAmbil }: { onSewa: () => void; onAmbil: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 'var(--sl-space-8)',
        fontFamily: 'var(--sl-font-display)',
      }}
    >
      <div style={{ fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
        {t('menu.judul')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-touch-gap)' }}>
        <KioskButton tone="primary" size="xl" onClick={onSewa}>
          {t('menu.sewa')}
        </KioskButton>
        <KioskButton tone="neutral" size="xl" onClick={onAmbil}>
          {t('menu.ambil')}
        </KioskButton>
      </div>
    </div>
  );
}
