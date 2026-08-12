import { useTranslation } from 'react-i18next';
import { KioskButton, KioskButtonGrid, type KioskButtonTone } from '@smartbox/ui';
import type { LokerButon, LokerStatus } from '../api/client';
import { KioskShell } from './KioskShell';

const TONE_PER_STATUS: Record<LokerStatus, KioskButtonTone> = {
  TERSEDIA: 'secondary',
  TERISI: 'danger',
  MAINTENANCE: 'neutral',
  OFFLINE: 'neutral',
  NONAKTIF: 'neutral',
};

/**
 * Fitur pilih loker spesifik (di luar cakupan PRD awal — permintaan bisnis
 * langsung): dulu kiosk cuma tampilkan Kategori (ukuran) lalu server
 * auto-assign loker manapun yang tersedia. Sekarang customer lihat &
 * pilih NOMOR loker sendiri (001, 002, dst) di kategori yang sudah
 * dipilih — semua loker ditampilkan (termasuk yang terisi/maintenance,
 * bukan disembunyikan) supaya customer tahu kapasitas unit sebenarnya,
 * cuma yang TERSEDIA yang bisa ditekan.
 */
export function LokerScreen({
  pilihan,
  onPilih,
  onKembali,
  errorMessage,
}: {
  pilihan: LokerButon[];
  onPilih: (lokerId: string) => void;
  onKembali: () => void;
  errorMessage?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <KioskShell step={3} title={t('loker.title')}>
      <KioskButtonGrid minColumnWidth={140}>
        {pilihan.map((l) => {
          const tersedia = l.status === 'TERSEDIA';
          return (
            <KioskButton
              key={l.id}
              tone={TONE_PER_STATUS[l.status]}
              size="md"
              fullWidth
              disabled={!tersedia}
              onClick={() => onPilih(l.id)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span>{t('loker.nomor', { nomor: l.nomorLoker })}</span>
                <span style={{ fontSize: 'var(--sl-kiosk-fs-caption)', fontWeight: 'var(--sl-fw-regular)' }}>
                  {t(`loker.status.${l.status}`)}
                </span>
              </div>
            </KioskButton>
          );
        })}
      </KioskButtonGrid>
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
