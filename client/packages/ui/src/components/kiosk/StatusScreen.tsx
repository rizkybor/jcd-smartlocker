import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';
import { KioskButton, type KioskButtonTone } from './KioskButton';

export type StatusScreenTone = 'danger' | 'warning' | 'neutral';

const TONE: Record<StatusScreenTone, { fg: string; tint: string }> = {
  danger: { fg: 'var(--sl-status-offline-strong)', tint: 'var(--sl-status-offline-tint)' },
  warning: { fg: 'var(--sl-status-occupied-strong)', tint: 'var(--sl-status-occupied-tint)' },
  neutral: { fg: 'var(--sl-text-muted)', tint: 'var(--sl-n-100)' },
};

export type StatusScreenProps = {
  icon: IconName;
  iconLabel?: string;
  tone?: StatusScreenTone;
  title: string;
  detail?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryTone?: KioskButtonTone;
  secondaryLabel?: string;
  onSecondary?: () => void;
  children?: ReactNode;
};

/**
 * Layar status penuh (gagal bayar, unit penuh, loker disuspend, dst) —
 * dulu tiap layar duplikat pola ikon+judul+detail+tombol sendiri-sendiri
 * (4 file nyaris identik). Disatukan di sini supaya konsisten & sekali
 * poles untuk semuanya: ikon sekarang dalam badge lingkaran bertint warna
 * (bukan ikon polos mengambang) — lebih jelas menunjukkan tingkat urgensi
 * (danger/warning/neutral) dan terasa lebih "dirancang", bukan cuma
 * ikon+teks berjajar.
 */
export function StatusScreen({
  icon,
  iconLabel,
  tone = 'danger',
  title,
  detail,
  primaryLabel,
  onPrimary,
  primaryTone = 'primary',
  secondaryLabel,
  onSecondary,
  children,
}: StatusScreenProps) {
  const toneStyle = TONE[tone];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 'var(--sl-space-6)',
        fontFamily: 'var(--sl-font-display)',
        textAlign: 'center',
        padding: 'var(--sl-kiosk-pad)',
        animation: 'sl-fade-up var(--sl-dur-slow) var(--sl-ease-out) both',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 128,
          height: 128,
          borderRadius: 'var(--sl-radius-pill)',
          background: toneStyle.tint,
        }}
      >
        <Icon name={icon} size={64} color={toneStyle.fg} label={iconLabel} />
      </span>
      <div>
        <div style={{ fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', lineHeight: 'var(--sl-lh-tight)' }}>
          {title}
        </div>
        {detail ? (
          <div
            style={{
              marginTop: 'var(--sl-space-3)',
              fontFamily: 'var(--sl-font-body)',
              fontSize: 'var(--sl-kiosk-fs-body)',
              fontWeight: 'var(--sl-fw-regular)',
              color: 'var(--sl-text-muted)',
              lineHeight: 'var(--sl-lh-normal)',
              maxWidth: 480,
            }}
          >
            {detail}
          </div>
        ) : null}
      </div>
      {children}
      {primaryLabel || secondaryLabel ? (
        <div style={{ display: 'flex', gap: 'var(--sl-touch-gap)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {primaryLabel ? (
            <KioskButton tone={primaryTone} size="lg" onClick={onPrimary}>
              {primaryLabel}
            </KioskButton>
          ) : null}
          {secondaryLabel ? (
            <KioskButton tone="neutral" size="lg" onClick={onSecondary}>
              {secondaryLabel}
            </KioskButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
