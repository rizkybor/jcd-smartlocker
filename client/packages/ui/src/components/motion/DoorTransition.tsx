import type { CSSProperties, ReactNode } from 'react';

export type DoorTransitionProps = {
  open: boolean;
  id?: string;
  contentLabel?: ReactNode;
  label?: ReactNode;
  size?: number;
  style?: CSSProperties;
};

/** Animasi buka pintu loker 700ms (PRD §5.1 langkah 6, §5.2 langkah 4). */
export function DoorTransition({ open, id = 'A-04', contentLabel = 'AMBIL', label, size = 260, style }: DoorTransitionProps) {
  return (
    <div style={{ fontFamily: 'var(--sl-font-display)', textAlign: 'center', ...style }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto', perspective: 900 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--sl-radius-lg)',
            background: 'var(--sl-ink-navy)',
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontSize: size * 0.22,
              fontWeight: 'var(--sl-fw-bold)',
              color: open ? 'var(--sl-status-available)' : 'rgba(255,255,255,.25)',
              transition: 'color var(--sl-dur-base) var(--sl-ease-standard)',
            }}
          >
            {contentLabel}
          </span>
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d',
            borderRadius: 'var(--sl-radius-lg)',
            background: 'linear-gradient(135deg,var(--sl-secondary) 0%,var(--sl-primary) 100%)',
            border: 'var(--sl-border-w-selected) solid var(--sl-ink-navy)',
            boxShadow: 'var(--sl-elev-3)',
            animation: `${open ? 'sl-door-open' : 'sl-door-close'} var(--sl-dur-door) var(--sl-ease-door) forwards`,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <span style={{ fontSize: size * 0.18, fontWeight: 'var(--sl-fw-extrabold)', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {id}
          </span>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              width: 10,
              height: 44,
              marginTop: -22,
              borderRadius: 'var(--sl-radius-pill)',
              background: 'rgba(255,255,255,.5)',
            }}
          />
        </div>
      </div>
      {label ? (
        <div
          style={{
            marginTop: 'var(--sl-space-6)',
            fontSize: 'var(--sl-kiosk-fs-body)',
            fontWeight: 'var(--sl-fw-semibold)',
            color: open ? 'var(--sl-status-available-strong)' : 'var(--sl-text-muted)',
            transition: 'color var(--sl-dur-base) var(--sl-ease-standard)',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}
