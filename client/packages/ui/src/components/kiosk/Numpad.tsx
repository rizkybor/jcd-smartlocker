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

/**
 * Keypad angka untuk input nomor HP/OTP (PRD §5.1 langkah 3, §5.2 langkah
 * 3). Kotak slot digit dihitung ADAPTIF terhadap `length` — nomor HP
 * (length 13) & kode OTP (length 6) berbagi komponen yang sama, jadi
 * ukuran box/gap/font tetap 64px/hero(56px) buat panjang 6 ke bawah, tapi
 * MENGECIL proporsional untuk input yang lebih panjang, supaya tidak
 * overflow/shrink paksa oleh flexbox (dulu selalu 64px fixed -> untuk 13
 * digit otomatis diperas flexbox jadi ~35px tapi fontnya tetap 56px, jadi
 * kepotong & areanya kelihatan sempit).
 */
export function Numpad({ value, onChange, length = 6, mask, label, style }: NumpadProps) {
  const push = (key: (typeof KEYS)[number]) => {
    if (key === 'clear') return onChange('');
    if (key === 'back') return onChange(value.slice(0, -1));
    if (value.length < length) onChange(value + key);
  };

  // Lebar konten kiosk ~552px (kanvas 600px - 2x --sl-kiosk-pad 24px, §13.1)
  // — dipakai sebagai patokan, bukan diukur langsung dari DOM, supaya tidak
  // perlu ResizeObserver untuk kasus yang cuma ada 2 varian (6 & 13).
  const KONTEN_KIOSK_PX = 520;
  const gap = length > 8 ? 8 : 12;
  const boxWidth = Math.max(30, Math.min(64, Math.floor((KONTEN_KIOSK_PX - gap * (length - 1)) / length)));
  const boxHeight = boxWidth + 24;
  const boxFontSize = Math.max(24, boxWidth - 12);

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
          gap,
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
                width: boxWidth,
                height: boxHeight,
                flexShrink: 0,
                borderRadius: 'var(--sl-radius-md)',
                background: filled ? 'var(--sl-primary-tint)' : '#fff',
                border: `var(--sl-border-w-kiosk) solid ${active ? 'var(--sl-secondary)' : 'var(--sl-border-kiosk)'}`,
                boxShadow: active ? 'var(--sl-focus)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: boxFontSize,
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
                : { fontSize: 'var(--sl-kiosk-fs-title)' }
            }
          >
            {k === 'clear' ? 'HAPUS' : k === 'back' ? <Icon name="delete" size={40} label="Hapus satu angka" /> : k}
          </KioskButton>
        ))}
      </div>
    </div>
  );
}
