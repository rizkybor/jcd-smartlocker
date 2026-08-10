import { useTranslation } from 'react-i18next';
import { KioskButton, Icon } from '@smartbox/ui';

/**
 * Loker disuspend — terlambat ambil barang >= 24 jam (fitur overdue/denda/
 * suspend, di luar PRD awal). Dead end di kiosk: TIDAK ada tombol bayar/coba
 * lagi, cuma Super Admin yang bisa buka lewat Dashboard Company (lihat
 * server/backend/src/unit/unit.service.ts::bukaLokerSuspended()).
 */
export function LokerSuspendedScreen({ onKembali }: { onKembali: () => void }) {
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
      <Icon name="circle-alert" size={64} color="var(--sl-status-offline)" label={t('lokerSuspended.iconLabel')} />
      <div style={{ fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
        {t('lokerSuspended.judul')}
      </div>
      <div style={{ fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-kiosk-fs-body)', color: 'var(--sl-text-muted)', maxWidth: 600 }}>
        {t('lokerSuspended.detail')}
      </div>
      <KioskButton tone="neutral" size="lg" onClick={onKembali}>
        {t('common.kembali')}
      </KioskButton>
    </div>
  );
}
