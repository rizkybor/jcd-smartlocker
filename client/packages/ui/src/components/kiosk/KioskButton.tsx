import { useState, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react';

export type KioskButtonTone = 'primary' | 'secondary' | 'neutral' | 'danger' | 'success';
export type KioskButtonSize = 'md' | 'lg' | 'xl';

const TONE: Record<KioskButtonTone, { bg: string; fg: string; border: string; lift: string }> = {
  primary: { bg: 'var(--sl-primary)', fg: '#fff', border: 'var(--sl-primary)', lift: 'var(--sl-primary-press)' },
  secondary: { bg: 'var(--sl-secondary)', fg: '#fff', border: 'var(--sl-secondary)', lift: 'var(--sl-secondary-press)' },
  neutral: { bg: '#fff', fg: 'var(--sl-text-strong)', border: 'var(--sl-border-kiosk)', lift: 'var(--sl-n-200)' },
  danger: { bg: 'var(--sl-status-offline)', fg: '#fff', border: 'var(--sl-status-offline)', lift: 'var(--sl-status-offline-strong)' },
  success: { bg: 'var(--sl-status-available)', fg: '#fff', border: 'var(--sl-status-available)', lift: 'var(--sl-status-available-strong)' },
};

const SIZE: Record<KioskButtonSize, { h: string; fs: string; px: string }> = {
  md: { h: 'var(--sl-touch-min)', fs: 'var(--sl-kiosk-fs-label)', px: 'var(--sl-space-8)' },
  lg: { h: 'var(--sl-touch-comfort)', fs: 'var(--sl-kiosk-fs-label)', px: 'var(--sl-space-10)' },
  xl: { h: 'var(--sl-touch-cta)', fs: 'var(--sl-kiosk-fs-title)', px: 'var(--sl-space-12)' },
};

export type KioskButtonProps = {
  children: ReactNode;
  tone?: KioskButtonTone;
  size?: KioskButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  lifted?: boolean;
  icon?: ReactNode;
  ariaLabel?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
};

/** Tombol utama kiosk — target sentuh 88/112/128px, "lift" fisik saat ditekan (docs/design_reference §13.1). */
export function KioskButton({
  children,
  tone = 'primary',
  size = 'lg',
  fullWidth,
  disabled = false,
  lifted: liftedProp,
  icon,
  ariaLabel,
  onClick,
  style,
}: KioskButtonProps) {
  const [pressed, setPressed] = useState(false);
  const toneStyle = TONE[tone];
  const sizeStyle = SIZE[size];
  const lifted = (liftedProp ?? true) && tone !== 'neutral';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => !disabled && setPressed(false)}
      onPointerLeave={() => !disabled && setPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sl-space-4)',
        minHeight: sizeStyle.h,
        minWidth: fullWidth ? '100%' : 'var(--sl-touch-comfort)',
        width: fullWidth ? '100%' : undefined,
        padding: `0 ${sizeStyle.px}`,
        font: `var(--sl-fw-semibold) ${sizeStyle.fs}/1 var(--sl-font-display)`,
        letterSpacing: 'var(--sl-ls-normal)',
        color: disabled ? 'var(--sl-text-faint)' : toneStyle.fg,
        background: disabled ? 'var(--sl-n-100)' : toneStyle.bg,
        border: `var(--sl-border-w-kiosk) solid ${disabled ? 'var(--sl-n-200)' : toneStyle.border}`,
        borderRadius: 'var(--sl-radius-lg)',
        boxShadow: disabled || !lifted ? 'none' : `0 ${pressed ? '2px' : '8px'} 0 ${toneStyle.lift}`,
        transform: pressed ? 'translateY(6px)' : 'translateY(0)',
        transition:
          'transform var(--sl-dur-instant) var(--sl-ease-standard),box-shadow var(--sl-dur-instant) var(--sl-ease-standard),background var(--sl-dur-fast) var(--sl-ease-standard)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        ...style,
      }}
    >
      {icon ? (
        <span aria-hidden="true" style={{ fontSize: '1.1em', lineHeight: 1, display: 'inline-flex' }}>
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
