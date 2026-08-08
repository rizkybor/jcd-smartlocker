import type { CSSProperties, ReactNode } from 'react';

/**
 * Status loker: 5 nilai resmi terkunci (LokerStatus enum backend,
 * docs/PRD-Smartbox.md §12 poin 9, §13.1) — sama dengan yang dipakai
 * CompartmentCard di kiosk, BUKAN kosakata Inggris bebas dari prototipe
 * JSX asal. `online` ditambah terpisah untuk konteks kesehatan koneksi
 * unit (Epic 5 heartbeat), bukan status loker — dua konsep beda, jangan
 * disamakan.
 */
export type StatusBadgeStatus = 'online' | 'tersedia' | 'terisi' | 'maintenance' | 'offline' | 'nonaktif';

const MAP: Record<StatusBadgeStatus, { label: string; dot: string; bg: string; fg: string }> = {
  online: { label: 'Online', dot: 'var(--sl-status-available)', bg: 'var(--sl-status-available-tint)', fg: 'var(--sl-status-available-strong)' },
  tersedia: { label: 'Tersedia', dot: 'var(--sl-status-available)', bg: 'var(--sl-status-available-tint)', fg: 'var(--sl-status-available-strong)' },
  terisi: { label: 'Terisi', dot: 'var(--sl-status-occupied)', bg: 'var(--sl-status-occupied-tint)', fg: 'var(--sl-status-occupied-strong)' },
  maintenance: { label: 'Maintenance', dot: 'var(--sl-status-offline)', bg: 'var(--sl-status-offline-tint)', fg: 'var(--sl-status-offline-strong)' },
  offline: { label: 'Offline', dot: 'var(--sl-status-offline)', bg: 'var(--sl-status-offline-tint)', fg: 'var(--sl-status-offline-strong)' },
  nonaktif: { label: 'Nonaktif', dot: 'var(--sl-status-neutral)', bg: 'var(--sl-status-neutral-tint)', fg: 'var(--sl-n-600)' },
};

export type StatusBadgeProps = {
  status: StatusBadgeStatus;
  solid?: boolean;
  size?: 'md' | 'lg';
  pulse?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
};

/** Pill status (docs/design_reference/components/dashboard/StatusBadge.jsx). */
export function StatusBadge({ status, solid, size = 'md', pulse, children, style }: StatusBadgeProps) {
  const m = MAP[status];
  const big = size === 'lg';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: big ? 8 : 6,
        height: big ? 32 : 24,
        padding: big ? '0 12px' : '0 10px',
        borderRadius: 'var(--sl-radius-pill)',
        background: solid ? m.dot : m.bg,
        color: solid ? '#fff' : m.fg,
        border: `1px solid ${solid ? m.dot : 'transparent'}`,
        font: `var(--sl-fw-semibold) ${big ? 'var(--sl-fs-14)' : 'var(--sl-fs-12)'}/1 var(--sl-font-body)`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: big ? 10 : 8,
          height: big ? 10 : 8,
          borderRadius: 'var(--sl-radius-pill)',
          background: solid ? 'rgba(255,255,255,.9)' : m.dot,
          boxShadow: pulse ? `0 0 0 4px ${solid ? 'rgba(255,255,255,.25)' : m.bg}` : 'none',
        }}
      />
      {children || m.label}
    </span>
  );
}
