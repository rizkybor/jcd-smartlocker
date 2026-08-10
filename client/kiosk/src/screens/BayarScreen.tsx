import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRScreen, KioskButton } from '@smartbox/ui';
import { useQrDataUrl } from '../utils/useQrDataUrl';
import { formatRupiah } from '../utils/format';

function secondsUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000));
}

export function BayarScreen({
  qrString,
  nominal,
  expiredAt,
  onBatal,
}: {
  qrString: string | null;
  nominal: number | null;
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
      title={t('bayar.title')}
      subtitle={t('bayar.subtitle')}
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
