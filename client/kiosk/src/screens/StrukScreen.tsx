import { useTranslation } from 'react-i18next';
import { KioskButton, SuccessBurst } from '@smartbox/ui';
import type { StrukResult } from '../api/client';
import { formatRupiah } from '../utils/format';

export function StrukScreen({ struk, onSelesai }: { struk: StrukResult | null; onSelesai: () => void }) {
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
        padding: 'var(--sl-kiosk-pad)',
      }}
    >
      <SuccessBurst
        title={t('struk.judul')}
        detail={struk ? t('struk.loker', { nomor: struk.nomorLoker }) : undefined}
        size={140}
      />
      {struk ? (
        <div
          style={{
            fontFamily: 'var(--sl-font-body)',
            fontSize: 'var(--sl-kiosk-fs-caption)',
            color: 'var(--sl-text-muted)',
            textAlign: 'center',
          }}
        >
          <div>{t('struk.idTransaksi', { id: struk.idTransaksi })}</div>
          <div>{t('struk.durasi', { jam: struk.durasiJam, nominal: formatRupiah(struk.nominal) })}</div>
          {struk.berlakuSampai ? <div>{t('struk.berlakuSampai', { waktu: struk.berlakuSampai })}</div> : null}
        </div>
      ) : null}
      <KioskButton tone="primary" size="lg" onClick={onSelesai}>
        {t('common.selesai')}
      </KioskButton>
    </div>
  );
}
