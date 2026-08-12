import type { CSSProperties } from 'react';

export type StepProgressProps = {
  steps: string[];
  current: number;
  compact?: boolean;
  style?: CSSProperties;
};

/**
 * Indikator langkah alur kiosk (§5.1/§5.2) — dipin di atas tiap layar.
 *
 * Mode `compact` (dipakai kiosk, kanvas sempit 600px) SENGAJA bukan lagi
 * deretan N dot+label seperti mode penuh — alur Sewa sekarang 7 langkah
 * (Nomor HP/Email/Ukuran/Loker/Durasi/Bayar/Ambil Barang, lihat
 * KioskShell.tsx::sewaSteps()), dan 7 dot+label ~78px/kolom di kanvas 552px
 * konten jadi berdesakan & label kepotong. Diganti track progress ramping
 * + teks "Langkah X dari Y · Label" — tetap presisi & terbaca jelas
 * berapa pun jumlah langkahnya, tidak makin sempit tiap langkah baru
 * ditambah.
 */
export function StepProgress({ steps, current, compact = false, style }: StepProgressProps) {
  if (compact) {
    const total = steps.length;
    const currentLabel = steps[current] ?? '';
    const persen = total <= 1 ? 100 : Math.round(((current + 1) / total) * 100);
    return (
      <div style={{ width: '100%', fontFamily: 'var(--sl-font-display)', ...style }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 'var(--sl-space-3)',
            marginBottom: 'var(--sl-space-2)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--sl-fs-12)',
              fontWeight: 'var(--sl-fw-bold)',
              color: 'var(--sl-text-faint)',
              letterSpacing: 'var(--sl-ls-caps)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Langkah {current + 1}/{total}
          </span>
          <span
            style={{
              fontSize: 'var(--sl-fs-14)',
              fontWeight: 'var(--sl-fw-semibold)',
              color: 'var(--sl-primary)',
              textAlign: 'right',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentLabel}
          </span>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 'var(--sl-radius-pill)',
            background: 'var(--sl-n-200)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${persen}%`,
              height: '100%',
              borderRadius: 'var(--sl-radius-pill)',
              background: 'linear-gradient(90deg,var(--sl-secondary),var(--sl-primary))',
              transition: 'width var(--sl-dur-base) var(--sl-ease-standard)',
            }}
          />
        </div>
      </div>
    );
  }

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
