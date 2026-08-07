import type { CSSProperties, MouseEventHandler } from 'react';

/**
 * 5 status resmi — dikunci docs/PRD-Smartbox.md §12 poin 9, cocok 1:1
 * dengan enum `Loker.status` di backend (docs/ERD-Smartbox.md). Referensi
 * design_reference asli (SMB-002) cuma menangani 4 state (available/
 * occupied/offline/selected, dengan "offline" salah dilabeli "Maintenance")
 * — diperbaiki di sini supaya konsisten dengan status resmi.
 */
export type LokerStatus = 'tersedia' | 'terisi' | 'maintenance' | 'offline' | 'nonaktif';
export type CompartmentSize = 's' | 'm' | 'l' | 'xl';

const STATE: Record<
  LokerStatus | 'selected',
  { label: string; bg: string; bar: string; fg: string; border: string }
> = {
  tersedia: {
    label: 'Tersedia',
    bg: 'var(--sl-status-available-tint)',
    bar: 'var(--sl-status-available)',
    fg: 'var(--sl-status-available-strong)',
    border: 'var(--sl-status-available)',
  },
  terisi: {
    label: 'Terisi',
    bg: 'var(--sl-status-occupied-tint)',
    bar: 'var(--sl-status-occupied)',
    fg: 'var(--sl-status-occupied-strong)',
    border: 'var(--sl-status-occupied)',
  },
  // Maintenance & Offline berbagi warna merah yang sama (docs/design_reference §13.1
  // "Maintenance/Offline #DC2626") — beda label, sama tone visual.
  maintenance: {
    label: 'Maintenance',
    bg: 'var(--sl-status-offline-tint)',
    bar: 'var(--sl-status-offline)',
    fg: 'var(--sl-status-offline-strong)',
    border: 'var(--sl-status-offline)',
  },
  offline: {
    label: 'Offline',
    bg: 'var(--sl-status-offline-tint)',
    bar: 'var(--sl-status-offline)',
    fg: 'var(--sl-status-offline-strong)',
    border: 'var(--sl-status-offline)',
  },
  nonaktif: {
    label: 'Nonaktif',
    bg: 'var(--sl-status-neutral-tint)',
    bar: 'var(--sl-status-neutral)',
    fg: 'var(--sl-text-muted)',
    border: 'var(--sl-status-neutral)',
  },
  selected: {
    label: 'Dipilih',
    bg: 'var(--sl-primary)',
    bar: 'var(--sl-spark)',
    fg: '#fff',
    border: 'var(--sl-ink-navy)',
  },
};

const SIZE_LABEL: Record<CompartmentSize, string> = { s: 'Kecil', m: 'Sedang', l: 'Besar', xl: 'Ekstra' };

export type CompartmentCardProps = {
  id: string;
  state: LokerStatus;
  selected?: boolean;
  size?: CompartmentSize;
  meta?: string;
  statusLabel?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
};

/** Tile status loker — dipakai kiosk (pilih loker) & dashboard (SMB-602/605). */
export function CompartmentCard({ id, state, selected, size = 'm', meta, statusLabel, onClick, style }: CompartmentCardProps) {
  const key = selected ? 'selected' : state;
  const s = STATE[key];
  const clickable = !!onClick && state === 'tersedia';

  return (
    <button
      type="button"
      disabled={!clickable && !selected}
      onClick={onClick}
      aria-pressed={selected ? 'true' : 'false'}
      style={{
        position: 'relative',
        textAlign: 'left',
        appearance: 'none',
        minWidth: 200,
        minHeight: 'var(--sl-touch-comfort)',
        padding: 'var(--sl-space-5) var(--sl-space-5) var(--sl-space-5) var(--sl-space-6)',
        background: s.bg,
        color: s.fg,
        border: `${selected ? 'var(--sl-border-w-selected)' : 'var(--sl-border-w-kiosk)'} solid ${s.border}`,
        borderRadius: 'var(--sl-radius-lg)',
        fontFamily: 'var(--sl-font-display)',
        overflow: 'hidden',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'transform var(--sl-dur-fast) var(--sl-ease-standard),background var(--sl-dur-base) var(--sl-ease-standard)',
        transform: selected ? 'translateY(-2px)' : 'none',
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: s.bar }}
      />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--sl-space-4)' }}>
        <span
          style={{
            fontSize: 'var(--sl-kiosk-fs-hero)',
            fontWeight: 'var(--sl-fw-bold)',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {id}
        </span>
        <span style={{ fontSize: 'var(--sl-kiosk-fs-caption)', fontWeight: 'var(--sl-fw-semibold)', opacity: 0.9 }}>
          {SIZE_LABEL[size]}
        </span>
      </div>
      <div
        style={{
          marginTop: 'var(--sl-space-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sl-space-2)',
          fontSize: 'var(--sl-kiosk-fs-caption)',
          fontWeight: 'var(--sl-fw-semibold)',
        }}
      >
        <span
          aria-hidden="true"
          style={{ width: 14, height: 14, borderRadius: 'var(--sl-radius-pill)', background: s.bar, display: 'inline-block' }}
        />
        {statusLabel || s.label}
      </div>
      {meta ? (
        <div
          style={{
            marginTop: 'var(--sl-space-2)',
            fontSize: 'var(--sl-kiosk-fs-caption)',
            fontWeight: 'var(--sl-fw-regular)',
            opacity: 0.85,
          }}
        >
          {meta}
        </div>
      ) : null}
    </button>
  );
}
