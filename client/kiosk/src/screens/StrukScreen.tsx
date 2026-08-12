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
      <SuccessBurst title={t('struk.judul')} size={128} />
      {struk ? (
        // Kartu "struk" (§ "experience design yang menarik") — dulu cuma
        // teks abu-abu berjajar, sekarang kartu putih dengan nomor loker
        // BESAR (info paling penting buat customer cari lokernya) + garis
        // putus-putus ala struk kasir memisahkan detail transaksi.
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: '#fff',
            border: 'var(--sl-border-w-kiosk) solid var(--sl-border-kiosk)',
            borderRadius: 'var(--sl-radius-xl)',
            boxShadow: 'var(--sl-elev-3)',
            overflow: 'hidden',
            animation: 'sl-fade-up var(--sl-dur-slow) var(--sl-ease-out) 260ms both',
          }}
        >
          <div style={{ padding: 'var(--sl-space-6)', textAlign: 'center', background: 'var(--sl-primary-tint)' }}>
            <div style={{ fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-fs-13)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-primary)', letterSpacing: 'var(--sl-ls-caps)', textTransform: 'uppercase' }}>
              {t('struk.lokerLabel')}
            </div>
            <div style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-kiosk-fs-hero)', fontWeight: 'var(--sl-fw-extrabold)', color: 'var(--sl-primary)', lineHeight: 'var(--sl-lh-tight)' }}>
              {struk.nomorLoker}
            </div>
          </div>
          <div
            style={{
              borderTop: '2px dashed var(--sl-border-kiosk)',
              padding: 'var(--sl-space-5) var(--sl-space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sl-space-2)',
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
        </div>
      ) : null}
      <KioskButton tone="primary" size="lg" onClick={onSelesai}>
        {t('common.selesai')}
      </KioskButton>
    </div>
  );
}
