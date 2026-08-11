import { useTranslation } from 'react-i18next';
import { KioskButton } from '@smartbox/ui';
import type { UnitDurasiHarga } from '../api/client';
import { formatRupiah } from '../utils/format';
import { KioskShell } from './KioskShell';

export function DurasiScreen({
  pilihan,
  onPilih,
  onKembali,
  errorMessage,
}: {
  pilihan: UnitDurasiHarga[];
  onPilih: (durasi: UnitDurasiHarga) => void;
  onKembali: () => void;
  errorMessage: string | null;
}) {
  const { t } = useTranslation();
  return (
    <KioskShell step={3} title={t('durasi.title')}>
      <div style={{ display: 'flex', gap: 'var(--sl-touch-gap)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {pilihan.map((d) => (
          <KioskButton key={d.id} tone="secondary" size="xl" onClick={() => onPilih(d)}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span>{t('durasi.jam', { jumlah: d.durasiJam })}</span>
              <span style={{ fontSize: 'var(--sl-kiosk-fs-body)', fontWeight: 'var(--sl-fw-regular)' }}>{formatRupiah(d.harga)}</span>
            </div>
          </KioskButton>
        ))}
      </div>
      {errorMessage ? (
        <div
          style={{
            marginTop: 'var(--sl-space-4)',
            textAlign: 'center',
            color: 'var(--sl-status-offline-strong)',
            fontFamily: 'var(--sl-font-body)',
            fontSize: 'var(--sl-kiosk-fs-caption)',
          }}
        >
          {errorMessage}
        </div>
      ) : null}
      <div style={{ marginTop: 'var(--sl-space-6)', textAlign: 'center' }}>
        <KioskButton tone="neutral" size="md" onClick={onKembali}>
          {t('common.kembali')}
        </KioskButton>
      </div>
    </KioskShell>
  );
}
