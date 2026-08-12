import { useTranslation } from 'react-i18next';
import { StatusScreen } from '@smartbox/ui';

/**
 * Loker disuspend — terlambat ambil barang >= 24 jam (fitur overdue/denda/
 * suspend, di luar PRD awal). Dead end di kiosk: TIDAK ada tombol bayar/coba
 * lagi, cuma Super Admin yang bisa buka lewat Dashboard Company (lihat
 * server/backend/src/unit/unit.service.ts::bukaLokerSuspended()).
 */
export function LokerSuspendedScreen({ onKembali }: { onKembali: () => void }) {
  const { t } = useTranslation();
  return (
    <StatusScreen
      icon="lock"
      iconLabel={t('lokerSuspended.iconLabel')}
      tone="danger"
      title={t('lokerSuspended.judul')}
      detail={t('lokerSuspended.detail')}
      primaryLabel={t('common.kembali')}
      onPrimary={onKembali}
      primaryTone="neutral"
    />
  );
}
