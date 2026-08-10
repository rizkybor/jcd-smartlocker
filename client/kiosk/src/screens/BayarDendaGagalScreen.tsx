import { useTranslation } from 'react-i18next';
import { KioskButton, Icon } from '@smartbox/ui';

export function BayarDendaGagalScreen({ onUlangi, onBatal }: { onUlangi: () => void; onBatal: () => void }) {
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
      <Icon name="circle-alert" size={64} color="var(--sl-status-offline)" label={t('bayarDendaGagal.iconLabel')} />
      <div style={{ fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
        {t('bayarDendaGagal.judul')}
      </div>
      <div style={{ fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-kiosk-fs-body)', color: 'var(--sl-text-muted)', maxWidth: 600 }}>
        {t('bayarDendaGagal.detail')}
      </div>
      <div style={{ display: 'flex', gap: 'var(--sl-touch-gap)' }}>
        <KioskButton tone="primary" size="lg" onClick={onUlangi}>
          {t('bayarGagal.cobaLagi')}
        </KioskButton>
        <KioskButton tone="neutral" size="lg" onClick={onBatal}>
          {t('common.batalkan')}
        </KioskButton>
      </div>
    </div>
  );
}
