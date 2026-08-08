import { useState, type CSSProperties, type ChangeEventHandler } from 'react';

export type FieldOption = { value: string; label: string };

export type FieldProps = {
  label?: string;
  required?: boolean;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
  options?: FieldOption[];
  error?: string;
  hint?: string;
  style?: CSSProperties;
};

/** Field form dashboard — input/textarea/select (docs/design_reference/components/dashboard/Field.jsx). */
export function Field({ label, required, value, onChange, disabled, placeholder, type = 'text', multiline, rows = 3, options, error, hint, style }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const invalid = !!error;

  const borderColor = focused ? 'var(--sl-secondary)' : invalid ? 'var(--sl-status-offline)' : 'var(--sl-border-strong)';
  const base: CSSProperties = {
    width: '100%',
    height: multiline ? undefined : 40,
    minHeight: multiline ? 96 : undefined,
    padding: multiline ? '10px 12px' : '0 12px',
    font: 'var(--sl-fw-medium) var(--sl-fs-14)/1.4 var(--sl-font-body)',
    color: 'var(--sl-text-strong)',
    background: disabled ? 'var(--sl-n-50)' : '#fff',
    border: `var(--sl-border-w) solid ${borderColor}`,
    borderRadius: 'var(--sl-radius-sm)',
    boxShadow: focused ? 'var(--sl-focus)' : 'var(--sl-elev-inset)',
    outline: 'none',
    transition: 'border-color var(--sl-dur-fast) var(--sl-ease-standard), box-shadow var(--sl-dur-fast) var(--sl-ease-standard)',
  };
  const common = {
    value,
    onChange,
    disabled,
    placeholder,
    style: base,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };

  return (
    <label style={{ display: 'block', width: '100%', ...style }}>
      {label ? (
        <span style={{ display: 'flex', gap: 4, marginBottom: 6, fontSize: 'var(--sl-fs-13)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-text-body)' }}>
          {label}
          {required ? <span style={{ color: 'var(--sl-status-offline)' }}>*</span> : null}
        </span>
      ) : null}
      {options ? (
        <select {...common}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea {...common} rows={rows} />
      ) : (
        <input {...common} type={type} />
      )}
      {error ? (
        <span style={{ display: 'block', marginTop: 6, fontSize: 'var(--sl-fs-12)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-status-offline-strong)' }}>
          {error}
        </span>
      ) : hint ? (
        <span style={{ display: 'block', marginTop: 6, fontSize: 'var(--sl-fs-12)', color: 'var(--sl-text-muted)' }}>{hint}</span>
      ) : null}
    </label>
  );
}
