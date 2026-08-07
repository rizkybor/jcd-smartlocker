import type { CSSProperties, ReactNode } from 'react';

export type QRScreenProps = {
  title?: string;
  subtitle?: string;
  qrSrc?: string;
  qrSize?: number;
  amount?: string;
  secondsLeft?: number;
  footer?: ReactNode;
  style?: CSSProperties;
};

/** Panel QRIS full-screen dengan countdown (PRD §5.1 langkah 5). */
export function QRScreen({ title, subtitle, qrSrc, qrSize = 360, amount, secondsLeft, footer, style }: QRScreenProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sl-space-8)',
        padding: 'var(--sl-kiosk-pad)',
        width: '100%',
        background: 'var(--sl-surface-kiosk)',
        fontFamily: 'var(--sl-font-display)',
        textAlign: 'center',
        ...style,
      }}
    >
      <div>
        <div style={{ fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
          {title || 'Scan untuk Bayar'}
        </div>
        {subtitle ? (
          <div style={{ marginTop: 'var(--sl-space-3)', fontSize: 'var(--sl-kiosk-fs-body)', fontWeight: 'var(--sl-fw-regular)', color: 'var(--sl-text-muted)' }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      <div style={{ padding: 'var(--sl-space-6)', background: '#fff', border: 'var(--sl-border-w-kiosk) solid var(--sl-border-kiosk)', borderRadius: 'var(--sl-radius-xl)' }}>
        {qrSrc ? (
          <img src={qrSrc} alt="Kode QR pembayaran" style={{ display: 'block', width: qrSize, height: qrSize, imageRendering: 'pixelated' }} />
        ) : (
          <div
            aria-label="Tempat kode QR"
            style={{
              width: qrSize,
              height: qrSize,
              display: 'grid',
              placeItems: 'center',
              background: 'repeating-conic-gradient(var(--sl-n-900) 0% 25%,#fff 0% 50%) 0 0/40px 40px',
              borderRadius: 'var(--sl-radius-sm)',
            }}
          >
            <span
              style={{
                background: '#fff',
                padding: 'var(--sl-space-3) var(--sl-space-4)',
                borderRadius: 'var(--sl-radius-sm)',
                fontSize: 'var(--sl-fs-14)',
                fontWeight: 'var(--sl-fw-semibold)',
                color: 'var(--sl-text-muted)',
                fontFamily: 'var(--sl-font-body)',
              }}
            >
              QR placeholder
            </span>
          </div>
        )}
      </div>
      {amount ? (
        <div>
          <div style={{ fontSize: 'var(--sl-kiosk-fs-caption)', color: 'var(--sl-text-muted)', fontWeight: 'var(--sl-fw-medium)' }}>Total</div>
          <div style={{ fontSize: 'var(--sl-kiosk-fs-hero)', fontWeight: 'var(--sl-fw-extrabold)', color: 'var(--sl-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {amount}
          </div>
        </div>
      ) : null}
      {typeof secondsLeft === 'number' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sl-space-3)',
            padding: 'var(--sl-space-3) var(--sl-space-6)',
            borderRadius: 'var(--sl-radius-pill)',
            background: 'var(--sl-status-occupied-tint)',
            color: 'var(--sl-status-occupied-strong)',
            fontSize: 'var(--sl-kiosk-fs-caption)',
            fontWeight: 'var(--sl-fw-semibold)',
          }}
        >
          Berlaku {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
        </div>
      ) : null}
      {footer}
    </div>
  );
}
