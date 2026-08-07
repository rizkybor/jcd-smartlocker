import type { CSSProperties } from 'react';
import { KioskButton } from './KioskButton';
import { Icon } from '../icons/Icon';

export type NumpadProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  mask?: boolean;
  label?: string;
  style?: CSSProperties;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'] as const;

/** Keypad angka untuk input nomor HP/OTP (PRD §5.1 langkah 3, §5.2 langkah 3). */
export function Numpad({ value, onChange, length = 6, mask, label, style }: NumpadProps) {
  const push = (key: (typeof KEYS)[number]) => {
    if (key === 'clear') return onChange('');
    if (key === 'back') return onChange(value.slice(0, -1));
    if (value.length < length) onChange(value + key);
  };

  return (
    <div style={{ width: '100%', maxWidth: 560, fontFamily: 'var(--sl-font-display)', ...style }}>
      {label ? (
        <div
          style={{
            fontSize: 'var(--sl-kiosk-fs-body)',
            fontWeight: 'var(--sl-fw-medium)',
            color: 'var(--sl-text-muted)',
            marginBottom: 'var(--sl-space-4)',
            textAlign: 'center',
          }}
        >
          {label}
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          gap: 'var(--sl-space-3)',
          justifyContent: 'center',
          marginBottom: 'var(--sl-space-8)',
        }}
      >
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const active = i === value.length;
          return (
            <div
              key={i}
              style={{
                width: 64,
                height: 88,
                borderRadius: 'var(--sl-radius-md)',
                background: filled ? 'var(--sl-primary-tint)' : '#fff',
                border: `var(--sl-border-w-kiosk) solid ${active ? 'var(--sl-secondary)' : 'var(--sl-border-kiosk)'}`,
                boxShadow: active ? 'var(--sl-focus)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--sl-kiosk-fs-hero)',
                fontWeight: 'var(--sl-fw-bold)',
                color: 'var(--sl-primary)',
                transition: 'all var(--sl-dur-fast) var(--sl-ease-standard)',
              }}
            >
              {filled ? (mask ? '•' : value[i]) : ''}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--sl-touch-gap)' }}>
        {KEYS.map((k) => (
          <KioskButton
            key={k}
            tone={k === 'clear' || k === 'back' ? 'neutral' : 'secondary'}
            size="lg"
            fullWidth
            ariaLabel={k === 'back' ? 'Hapus satu angka' : k === 'clear' ? 'Hapus semua' : k}
            onClick={() => push(k)}
            style={
              k === 'clear' || k === 'back'
                ? { fontSize: 'var(--sl-kiosk-fs-body)', color: 'var(--sl-text-muted)' }
                : { fontSize: 'var(--sl-kiosk-fs-hero)' }
            }
          >
            {k === 'clear' ? 'HAPUS' : k === 'back' ? <Icon name="delete" size={40} label="Hapus satu angka" /> : k}
          </KioskButton>
        ))}
      </div>
    </div>
  );
}
