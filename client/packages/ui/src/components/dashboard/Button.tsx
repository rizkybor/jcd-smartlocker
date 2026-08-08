import { useState, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react';

export type ButtonTone = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const TONE: Record<ButtonTone, { bg: string; fg: string; bd: string; hover: string }> = {
  primary: { bg: 'var(--sl-primary)', fg: '#fff', bd: 'var(--sl-primary)', hover: 'var(--sl-primary-hover)' },
  secondary: { bg: 'var(--sl-secondary)', fg: '#fff', bd: 'var(--sl-secondary)', hover: 'var(--sl-secondary-hover)' },
  outline: { bg: '#fff', fg: 'var(--sl-primary)', bd: 'var(--sl-border-strong)', hover: 'var(--sl-n-50)' },
  ghost: { bg: 'transparent', fg: 'var(--sl-text-body)', bd: 'transparent', hover: 'var(--sl-n-100)' },
  danger: { bg: 'var(--sl-status-offline)', fg: '#fff', bd: 'var(--sl-status-offline)', hover: 'var(--sl-status-offline-strong)' },
};

const SIZE: Record<ButtonSize, { h: number; fs: string; px: number }> = {
  sm: { h: 32, fs: 'var(--sl-fs-13)', px: 12 },
  md: { h: 40, fs: 'var(--sl-fs-14)', px: 16 },
  lg: { h: 48, fs: 'var(--sl-fs-16)', px: 22 },
};

export type ButtonProps = {
  tone?: ButtonTone;
  size?: ButtonSize;
  type?: 'button' | 'submit';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
};

/** Tombol dashboard (docs/design_reference/components/dashboard/Button.jsx). */
export function Button({ tone = 'primary', size = 'md', type = 'button', disabled = false, fullWidth, icon, children, onClick, style }: ButtonProps) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const t = TONE[tone];
  const s = SIZE[size];

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: s.h,
        padding: `0 ${s.px}px`,
        width: fullWidth ? '100%' : undefined,
        font: `var(--sl-fw-semibold) ${s.fs}/1 var(--sl-font-body)`,
        color: disabled ? 'var(--sl-text-faint)' : t.fg,
        background: disabled ? 'var(--sl-n-100)' : hover ? t.hover : t.bg,
        border: `var(--sl-border-w) solid ${disabled ? 'var(--sl-n-200)' : t.bd}`,
        borderRadius: 'var(--sl-radius-sm)',
        boxShadow: tone === 'ghost' || disabled ? 'none' : 'var(--sl-elev-1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: !disabled && pressed ? 'scale(.98)' : 'scale(1)',
        transition: 'background var(--sl-dur-fast) var(--sl-ease-standard), transform var(--sl-dur-instant) var(--sl-ease-standard)',
        ...style,
      }}
    >
      {icon ? <span aria-hidden="true" style={{ display: 'inline-flex' }}>{icon}</span> : null}
      {children}
    </button>
  );
}
