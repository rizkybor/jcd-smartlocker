import { useTranslation } from 'react-i18next';
import { KioskButton, KioskButtonGrid } from '@smartbox/ui';
import type { KategoriLoker } from '../api/client';
import { KioskShell } from './KioskShell';

/**
 * Fitur harga & pilihan per ukuran loker (di luar cakupan PRD awal —
 * permintaan bisnis langsung): satu unit bisa punya beberapa kategori
 * ukuran loker, masing-masing dengan harga & ketersediaan sendiri.
 * Kategori dengan `jumlahTersedia === 0` ditampilkan TAPI disabled — biar
 * pelanggan tahu ukuran itu ada tapi sedang penuh, bukan hilang begitu
 * saja dari pilihan.
 */
export function KategoriScreen({
  pilihan,
  onPilih,
  onKembali,
}: {
  pilihan: KategoriLoker[];
  onPilih: (kategori: KategoriLoker) => void;
  onKembali: () => void;
}) {
  const { t } = useTranslation();
  return (
    <KioskShell step={2} title={t('kategori.title')}>
      <KioskButtonGrid minColumnWidth={200}>
        {pilihan.map((k) => {
          const penuh = k.jumlahTersedia === 0;
          return (
            <KioskButton
              key={k.id}
              tone={penuh ? 'neutral' : 'secondary'}
              size="xl"
              fullWidth
              disabled={penuh}
              onClick={() => onPilih(k)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span>{k.nama}</span>
                {k.ukuranWMm && k.ukuranHMm ? (
                  <span style={{ fontSize: 'var(--sl-kiosk-fs-body)', fontWeight: 'var(--sl-fw-regular)' }}>
                    {t('kategori.ukuran', { w: k.ukuranWMm, h: k.ukuranHMm })}
                  </span>
                ) : null}
                <span style={{ fontSize: 'var(--sl-kiosk-fs-caption)', fontWeight: 'var(--sl-fw-regular)' }}>
                  {penuh ? t('kategori.penuh') : t('kategori.tersedia', { jumlah: k.jumlahTersedia })}
                </span>
              </div>
            </KioskButton>
          );
        })}
      </KioskButtonGrid>
      <div style={{ marginTop: 'var(--sl-space-6)', textAlign: 'center' }}>
        <KioskButton tone="neutral" size="md" onClick={onKembali}>
          {t('common.kembali')}
        </KioskButton>
      </div>
    </KioskShell>
  );
}
