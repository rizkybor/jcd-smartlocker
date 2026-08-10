import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRScreen, KioskButton } from '@smartbox/ui';
import { useQrDataUrl } from '../utils/useQrDataUrl';
import { formatRupiah } from '../utils/format';

function secondsUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000));
}

/**
 * Bayar denda keterlambatan ambil barang (fitur overdue/suspend, di luar
 * PRD awal) — dipakai kalau `waktuSelesai` sudah lewat tapi belum 24 jam
 * (lihat overdue.util.ts di backend & sewaMachine.ts state `ambilBayarDenda`).
 */
export function BayarDendaScreen({
  qrString,
  nominal,
  jamTerlambat,
  expiredAt,
  onBatal,
}: {
  qrString: string | null;
  nominal: number | null;
  jamTerlambat: number | null;
  expiredAt: string | null;
  onBatal: () => void;
}) {
  const { t } = useTranslation();
  const qrSrc = useQrDataUrl(qrString);
  const [secondsLeft, setSecondsLeft] = useState(() => (expiredAt ? secondsUntil(expiredAt) : 0));

  useEffect(() => {
    if (!expiredAt) return;
    setSecondsLeft(secondsUntil(expiredAt));
    const interval = setInterval(() => setSecondsLeft(secondsUntil(expiredAt)), 1000);
    return () => clearInterval(interval);
  }, [expiredAt]);

  return (
    <QRScreen
      title={t('bayarDenda.title')}
      subtitle={jamTerlambat !== null ? t('bayarDenda.subtitle', { jam: jamTerlambat }) : undefined}
      qrSrc={qrSrc ?? undefined}
      amount={nominal !== null ? formatRupiah(nominal) : undefined}
      secondsLeft={expiredAt ? secondsLeft : undefined}
      footer={
        <KioskButton tone="neutral" size="md" onClick={onBatal}>
          {t('common.batalkan')}
        </KioskButton>
      }
    />
  );
}
