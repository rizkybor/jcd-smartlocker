import { useTranslation } from 'react-i18next';
import { KioskButton, KioskButtonGrid } from '@smartbox/ui';
import type { UnitDurasiHarga } from '../api/client';
import { formatRupiah } from '../utils/format';
import { KioskShell } from './KioskShell';

export function DurasiScreen({
  pilihan,
  onPilih,
  onKembali,
  errorMessage,
  loading = false,
}: {
  pilihan: UnitDurasiHarga[];
  onPilih: (durasi: UnitDurasiHarga) => void;
  onKembali: () => void;
  errorMessage: string | null;
  /** Sesi sedang dibuat di backend (state `memulaiSewa`) — kunci tombol supaya tidak dobel-klik saat menunggu respons API. */
  loading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <KioskShell step={4} title={t('durasi.title')}>
      <KioskButtonGrid minColumnWidth={180}>
        {pilihan.map((d) => (
          <KioskButton key={d.id} tone="secondary" size="xl" fullWidth disabled={loading} onClick={() => onPilih(d)}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span>{t('durasi.jam', { jumlah: d.durasiJam })}</span>
              <span style={{ fontSize: 'var(--sl-kiosk-fs-body)', fontWeight: 'var(--sl-fw-regular)' }}>{formatRupiah(d.harga)}</span>
            </div>
          </KioskButton>
        ))}
      </KioskButtonGrid>
      {loading ? (
        <div
          style={{
            marginTop: 'var(--sl-space-4)',
            textAlign: 'center',
            color: 'var(--sl-text-muted)',
            fontFamily: 'var(--sl-font-body)',
            fontSize: 'var(--sl-kiosk-fs-caption)',
          }}
        >
          {t('durasi.memproses')}
        </div>
      ) : null}
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
