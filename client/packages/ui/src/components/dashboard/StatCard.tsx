import type { CSSProperties, ReactNode } from 'react';

export type StatCardAccent = 'primary' | 'accent' | 'available' | 'occupied' | 'offline';

const ACCENT_COLOR: Record<StatCardAccent, string> = {
  primary: 'var(--sl-secondary)',
  accent: 'var(--sl-accent)',
  available: 'var(--sl-status-available)',
  occupied: 'var(--sl-status-occupied)',
  offline: 'var(--sl-status-offline)',
};

export type StatCardProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  badge?: ReactNode;
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'flat';
  caption?: string;
  accent?: StatCardAccent;
  style?: CSSProperties;
};

/** Kartu metrik ringkasan (docs/design_reference/components/dashboard/StatCard.jsx). */
export function StatCard({ label, value, unit, badge, delta, deltaDirection = 'flat', caption, accent = 'primary', style }: StatCardProps) {
  const deltaColor =
    deltaDirection === 'up' ? 'var(--sl-status-available-strong)' : deltaDirection === 'down' ? 'var(--sl-status-offline-strong)' : 'var(--sl-text-muted)';
  const arrow = deltaDirection === 'up' ? '↑' : deltaDirection === 'down' ? '↓' : '→';

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--sl-surface-card)',
        border: 'var(--sl-border-w) solid var(--sl-border)',
        borderRadius: 'var(--sl-radius-md)',
        boxShadow: 'var(--sl-elev-1)',
        padding: 'var(--sl-space-5) var(--sl-space-6)',
        minWidth: 200,
        overflow: 'hidden',
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: ACCENT_COLOR[accent] }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: 'var(--sl-fs-12)',
            fontWeight: 'var(--sl-fw-semibold)',
            letterSpacing: 'var(--sl-ls-caps)',
            textTransform: 'uppercase',
            color: 'var(--sl-text-muted)',
          }}
        >
          {label}
        </span>
        {badge}
      </div>
      <div style={{ marginTop: 'var(--sl-space-3)', display: 'flex', alignItems: 'baseline', gap: 'var(--sl-space-2)' }}>
        <span
          style={{
            fontFamily: 'var(--sl-font-display)',
            fontSize: 'var(--sl-fs-30)',
            fontWeight: 'var(--sl-fw-bold)',
            color: 'var(--sl-text-strong)',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {unit ? <span style={{ fontSize: 'var(--sl-fs-14)', color: 'var(--sl-text-muted)', fontWeight: 'var(--sl-fw-medium)' }}>{unit}</span> : null}
      </div>
      {delta || caption ? (
        <div style={{ marginTop: 'var(--sl-space-3)', display: 'flex', alignItems: 'center', gap: 'var(--sl-space-2)', fontSize: 'var(--sl-fs-13)' }}>
          {delta ? (
            <span style={{ color: deltaColor, fontWeight: 'var(--sl-fw-semibold)' }}>
              {arrow} {delta}
            </span>
          ) : null}
          {caption ? <span style={{ color: 'var(--sl-text-faint)' }}>{caption}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
