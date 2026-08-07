import type { CSSProperties } from 'react';

export type StepProgressProps = {
  steps: string[];
  current: number;
  compact?: boolean;
  style?: CSSProperties;
};

/** Indikator langkah alur kiosk (§5.1/§5.2) — dipin di atas tiap layar. */
export function StepProgress({ steps, current, compact = false, style }: StepProgressProps) {
  return (
    <ol
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0,
        listStyle: 'none',
        margin: 0,
        padding: 0,
        width: '100%',
        fontFamily: 'var(--sl-font-display)',
        ...style,
      }}
    >
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const dotBg = done ? 'var(--sl-status-available)' : active ? 'var(--sl-primary)' : '#fff';
        const dotFg = done || active ? '#fff' : 'var(--sl-text-faint)';
        return (
          <li key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {i > 0 ? (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: compact ? 18 : 26,
                  right: '50%',
                  width: '100%',
                  height: compact ? 4 : 6,
                  background: done || active ? 'var(--sl-status-available)' : 'var(--sl-n-200)',
                  borderRadius: 'var(--sl-radius-pill)',
                  transition: 'background var(--sl-dur-base) var(--sl-ease-standard)',
                }}
              />
            ) : null}
            <span
              style={{
                position: 'relative',
                zIndex: 1,
                width: compact ? 40 : 56,
                height: compact ? 40 : 56,
                borderRadius: 'var(--sl-radius-pill)',
                background: dotBg,
                color: dotFg,
                border: `var(--sl-border-w-kiosk) solid ${done ? 'var(--sl-status-available)' : active ? 'var(--sl-primary)' : 'var(--sl-border-kiosk)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: compact ? 'var(--sl-fs-18)' : 'var(--sl-kiosk-fs-body)',
                fontWeight: 'var(--sl-fw-bold)',
                transition: 'all var(--sl-dur-base) var(--sl-ease-standard)',
              }}
            >
              {done ? '✓' : i + 1}
            </span>
            <span
              style={{
                marginTop: 'var(--sl-space-3)',
                fontSize: compact ? 'var(--sl-fs-14)' : 'var(--sl-kiosk-fs-caption)',
                fontWeight: active ? 'var(--sl-fw-semibold)' : 'var(--sl-fw-medium)',
                color: active ? 'var(--sl-text-strong)' : 'var(--sl-text-muted)',
                textAlign: 'center',
                maxWidth: 180,
              }}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
