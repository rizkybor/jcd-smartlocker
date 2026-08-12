import type { CSSProperties, MouseEventHandler } from 'react';
import { Icon } from '../icons/Icon';

export type IdleScreenStat = { value: string; label: string };

export type IdleScreenProps = {
  headline?: string;
  subline?: string;
  logoSrc?: string;
  logoHeight?: number;
  stats?: IdleScreenStat[];
  footnote?: string;
  onWake?: MouseEventHandler<HTMLDivElement>;
  style?: CSSProperties;
};

/** Layar idle/attract — sentuh untuk mulai (PRD §5.1 langkah 1). */
export function IdleScreen({ headline, subline, logoSrc, logoHeight = 96, stats = [], footnote, onWake, style }: IdleScreenProps) {
  return (
    <div
      onClick={onWake}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        overflow: 'hidden',
        background: 'radial-gradient(120% 90% at 50% 0%,#1E3A8A 0%,var(--sl-ink-navy) 62%,#060F2B 100%)',
        color: 'var(--sl-text-on-dark)',
        fontFamily: 'var(--sl-font-display)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sl-space-8)',
        padding: 'var(--sl-kiosk-pad)',
        textAlign: 'center',
        cursor: 'pointer',
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,transparent 1px 88px),repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 88px)',
        }}
      />
      {logoSrc ? (
        <img
          src={logoSrc}
          alt="Sewa Smart Locker"
          style={{ height: logoHeight, position: 'relative', animation: 'sl-idle-float 4s ease-in-out infinite' }}
        />
      ) : null}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            fontSize: 'var(--sl-kiosk-fs-hero)',
            fontWeight: 'var(--sl-fw-extrabold)',
            lineHeight: 'var(--sl-lh-tight)',
            letterSpacing: 'var(--sl-ls-tight)',
            color: '#fff',
          }}
        >
          {headline || 'Sentuh untuk Sewa Loker'}
        </div>
        <div
          style={{
            marginTop: 'var(--sl-space-4)',
            fontSize: 'var(--sl-kiosk-fs-body)',
            fontWeight: 'var(--sl-fw-regular)',
            color: 'rgba(234,240,255,.78)',
            fontFamily: 'var(--sl-font-body)',
          }}
        >
          {subline || 'Tanpa aplikasi. Tanpa kunci. Bayar dengan QRIS.'}
        </div>
      </div>
      {/* Afordansi "sentuh untuk mulai" (§ "experience design yang menarik")
          — cincin pulsa di belakang ikon tangan, supaya screen idle tidak
          terasa statis/mati dan customer langsung tahu ini bisa disentuh. */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 96, height: 96 }}>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--sl-radius-pill)',
            border: '2px solid rgba(255,255,255,.55)',
            animation: 'sl-ring-out 1.8s var(--sl-ease-out) infinite',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: 'var(--sl-radius-pill)',
            background: 'rgba(255,255,255,.14)',
            border: '1px solid rgba(255,255,255,.3)',
            backdropFilter: 'blur(8px)',
            animation: 'sl-pulse 1.8s ease-in-out infinite',
          }}
        >
          <Icon name="hand" size={34} color="#fff" />
        </span>
      </div>
      {stats.length > 0 ? (
        <div style={{ position: 'relative', display: 'flex', gap: 'var(--sl-space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                minWidth: 180,
                padding: 'var(--sl-space-5) var(--sl-space-6)',
                borderRadius: 'var(--sl-radius-lg)',
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.16)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {s.value}
              </div>
              <div style={{ marginTop: 4, fontSize: 'var(--sl-kiosk-fs-caption)', color: 'rgba(234,240,255,.7)', fontFamily: 'var(--sl-font-body)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--sl-space-3)',
          fontSize: 'var(--sl-kiosk-fs-caption)',
          color: 'rgba(234,240,255,.6)',
          fontFamily: 'var(--sl-font-body)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 12,
            height: 12,
            borderRadius: 'var(--sl-radius-pill)',
            background: 'var(--sl-status-available)',
            boxShadow: '0 0 0 6px rgba(22,163,74,.22)',
          }}
        />
        {footnote || 'Unit aktif · PT Jendela Cakra Digital'}
      </div>
    </div>
  );
}
