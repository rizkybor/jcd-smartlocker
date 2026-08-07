import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * Render string QRIS mentah dari backend jadi gambar QR yang bisa
 * di-scan — backend cuma kasih payload string (PaymentProvider
 * `qrString`, docs/API-Contract-Smartbox.md §3), rendering gambar
 * dilakukan di kiosk (docs/PRD-Smartbox.md §9.3), bukan re-generate isi
 * QR, cuma menggambar ulang string yang sama.
 */
export function useQrDataUrl(qrString: string | null): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!qrString) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(qrString, { width: 360, margin: 1 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [qrString]);

  return dataUrl;
}
