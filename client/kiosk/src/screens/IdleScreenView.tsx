import { useTranslation } from 'react-i18next';
import { IdleScreen } from '@smartbox/ui';

export function IdleScreenView({
  onWake,
  errorMessage,
}: {
  onWake: () => void;
  errorMessage?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <IdleScreen headline={t('idle.headline')} subline={t('idle.subline')} onWake={onWake} />
      {errorMessage ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'var(--sl-kiosk-pad)',
            transform: 'translateX(-50%)',
            maxWidth: '80%',
            padding: 'var(--sl-space-3) var(--sl-space-5)',
            borderRadius: 'var(--sl-radius-lg)',
            background: 'rgba(220,38,38,.92)',
            color: '#fff',
            fontFamily: 'var(--sl-font-body)',
            fontSize: 'var(--sl-kiosk-fs-caption)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
