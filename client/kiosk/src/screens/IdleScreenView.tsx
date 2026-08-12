import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IdleScreen } from '@smartbox/ui';
import { kioskApi } from '../api/client';

export function IdleScreenView({
  onWake,
  errorMessage,
}: {
  onWake: () => void;
  errorMessage?: string | null;
}) {
  const { t } = useTranslation();
  /** Nama mitra pemilik unit ini, ditampilkan sebagai footnote layar awal (di luar cakupan PRD awal). */
  const [mitraNama, setMitraNama] = useState<string | null>(null);

  useEffect(() => {
    kioskApi
      .statusUnit()
      .then((res) => setMitraNama(res.data.mitraNama))
      .catch(() => {});
  }, []);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <IdleScreen headline={t('idle.headline')} subline={t('idle.subline')} onWake={onWake} footnote={mitraNama ?? undefined} />
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
