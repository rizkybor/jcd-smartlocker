import type { CSSProperties, ReactNode } from 'react';

export type SuccessBurstProps = {
  title?: ReactNode;
  detail?: ReactNode;
  tone?: 'success' | 'brand';
  size?: number;
  style?: CSSProperties;
};

/** Konfirmasi sukses (bayar/ambil barang) — PRD §5.1 langkah 6, §5.2 langkah 4. */
export function SuccessBurst({ title, detail, tone = 'success', size = 180, style }: SuccessBurstProps) {
  const color = tone === 'brand' ? 'var(--sl-primary)' : 'var(--sl-status-available)';
  return (
    <div style={{ fontFamily: 'var(--sl-font-display)', textAlign: 'center', ...style }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto', display: 'grid', placeItems: 'center' }}>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--sl-radius-pill)',
            border: `3px solid ${color}`,
            animation: 'sl-ring-out var(--sl-dur-celebrate) var(--sl-ease-out) forwards',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--sl-radius-pill)',
            border: `3px solid ${color}`,
            animation: 'sl-ring-out var(--sl-dur-celebrate) var(--sl-ease-out) 160ms forwards',
          }}
        />
        <div
          style={{
            width: size * 0.66,
            height: size * 0.66,
            borderRadius: 'var(--sl-radius-pill)',
            background: color,
            display: 'grid',
            placeItems: 'center',
            animation: 'sl-success-pop var(--sl-dur-slow) var(--sl-ease-door) forwards',
            boxShadow: 'var(--sl-elev-3)',
          }}
        >
          <svg width={size * 0.34} height={size * 0.34} viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M7 17l6 6 12-14"
              fill="none"
              stroke="#fff"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ strokeDasharray: 64, animation: 'sl-check-draw var(--sl-dur-slow) var(--sl-ease-out) 180ms forwards' }}
            />
          </svg>
        </div>
      </div>
      {title ? (
        <div
          style={{
            marginTop: 'var(--sl-space-6)',
            fontSize: 'var(--sl-kiosk-fs-title)',
            fontWeight: 'var(--sl-fw-bold)',
            color: 'var(--sl-text-strong)',
            animation: 'sl-fade-up var(--sl-dur-slow) var(--sl-ease-out) 220ms both',
          }}
        >
          {title}
        </div>
      ) : null}
      {detail ? (
        <div
          style={{
            marginTop: 'var(--sl-space-3)',
            fontFamily: 'var(--sl-font-body)',
            fontSize: 'var(--sl-kiosk-fs-body)',
            color: 'var(--sl-text-muted)',
            animation: 'sl-fade-up var(--sl-dur-slow) var(--sl-ease-out) 320ms both',
          }}
        >
          {detail}
        </div>
      ) : null}
    </div>
  );
}
