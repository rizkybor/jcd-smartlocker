import type { CSSProperties, ReactNode } from 'react';

const ELEV: Record<number, string> = {
  0: 'var(--sl-elev-0)',
  1: 'var(--sl-elev-1)',
  2: 'var(--sl-elev-2)',
  3: 'var(--sl-elev-3)',
  4: 'var(--sl-elev-4)',
  5: 'var(--sl-elev-5)',
};

export type PanelProps = {
  tone?: 'card' | 'sunken';
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  padding?: string | number;
  flush?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
};

/** Panel/card dashboard (docs/design_reference/components/dashboard/Panel.jsx). */
export function Panel({ tone, elevation = 1, padding = 'var(--sl-space-6)', flush, title, description, actions, children, style }: PanelProps) {
  return (
    <section
      style={{
        background: tone === 'sunken' ? 'var(--sl-surface-sunken)' : 'var(--sl-surface-card)',
        border: 'var(--sl-border-w) solid var(--sl-border)',
        borderRadius: 'var(--sl-radius-md)',
        boxShadow: ELEV[elevation],
        overflow: 'hidden',
        ...style,
      }}
    >
      {title || actions ? (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--sl-space-4)',
            padding: 'var(--sl-space-5) var(--sl-space-6)',
            borderBottom: 'var(--sl-border-w) solid var(--sl-border)',
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--sl-fs-16)', fontWeight: 'var(--sl-fw-semibold)' }}>{title}</h3>
            {description ? <p style={{ margin: '4px 0 0', fontSize: 'var(--sl-fs-13)', color: 'var(--sl-text-muted)' }}>{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div style={{ padding: flush ? 0 : padding }}>{children}</div>
    </section>
  );
}
