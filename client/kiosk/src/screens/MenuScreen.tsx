import { useTranslation } from 'react-i18next';
import { Icon, KioskButton } from '@smartbox/ui';

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
        gap: 'var(--sl-space-10)',
        fontFamily: 'var(--sl-font-display)',
        padding: 'var(--sl-kiosk-pad)',
        animation: 'sl-fade-up var(--sl-dur-slow) var(--sl-ease-out) both',
      }}
    >
      <div
        style={{
          fontSize: 'var(--sl-kiosk-fs-title)',
          fontWeight: 'var(--sl-fw-bold)',
          color: 'var(--sl-text-strong)',
          letterSpacing: 'var(--sl-ls-tight)',
          textAlign: 'center',
        }}
      >
        {t('menu.judul')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-touch-gap)', width: '100%', maxWidth: 420 }}>
        <KioskButton tone="primary" size="xl" fullWidth icon={<Icon name="package" size={40} />} onClick={onSewa}>
          {t('menu.sewa')}
        </KioskButton>
        <KioskButton tone="neutral" size="xl" fullWidth icon={<Icon name="package-open" size={40} />} onClick={onAmbil}>
          {t('menu.ambil')}
        </KioskButton>
      </div>
    </div>
  );
}
