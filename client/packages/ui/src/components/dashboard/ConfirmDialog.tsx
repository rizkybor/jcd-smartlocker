import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './Button';
import { Field } from './Field';

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` dipakai untuk aksi sensitif — nonaktifkan unit, buka paksa, dst. (§5.6). */
  tone?: 'primary' | 'danger';
  loading?: boolean;
  /** Field alasan wajib diisi — dipakai aksi yang harus tercatat ke LOG_AKTIVITAS (§7.1). */
  requireReason?: boolean;
  reasonLabel?: string;
  reasonValue?: string;
  onReasonChange?: (value: string) => void;
  errorMessage?: string | null;
  onConfirm: () => void;
  children?: ReactNode;
};

/**
 * Modal konfirmasi untuk aksi sensitif (docs/PRD-Smartbox.md §5.6, §9.3) —
 * dibungkus dari Radix UI Dialog (accessible: focus trap, keyboard nav,
 * Esc-to-close bawaan) sesuai keputusan tech stack, bukan modal ad hoc
 * per halaman.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  tone = 'primary',
  loading = false,
  requireReason = false,
  reasonLabel = 'Alasan',
  reasonValue = '',
  onReasonChange,
  errorMessage,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const confirmDisabled = loading || (requireReason && reasonValue.trim().length === 0);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11,27,69,.45)',
            animation: 'sl-dialog-overlay-in var(--sl-dur-fast) var(--sl-ease-standard)',
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            maxWidth: 440,
            background: '#fff',
            borderRadius: 'var(--sl-radius-lg)',
            boxShadow: 'var(--sl-elev-5)',
            padding: 'var(--sl-space-6)',
            fontFamily: 'var(--sl-font-body)',
            animation: 'sl-dialog-content-in var(--sl-dur-base) var(--sl-ease-out)',
          }}
        >
          <Dialog.Title
            style={{
              fontFamily: 'var(--sl-font-display)',
              fontSize: 'var(--sl-fs-20)',
              fontWeight: 'var(--sl-fw-bold)',
              color: 'var(--sl-text-strong)',
              margin: 0,
            }}
          >
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description
              style={{
                marginTop: 'var(--sl-space-2)',
                fontSize: 'var(--sl-fs-14)',
                color: 'var(--sl-text-muted)',
              }}
            >
              {description}
            </Dialog.Description>
          ) : null}

          <div style={{ marginTop: 'var(--sl-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
            {children}
            {requireReason ? (
              <Field
                label={reasonLabel}
                required
                multiline
                rows={3}
                value={reasonValue}
                onChange={(e) => onReasonChange?.(e.target.value)}
                placeholder="Wajib diisi — dicatat ke log aktivitas."
              />
            ) : null}
            {errorMessage ? (
              <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-offline-strong)' }}>{errorMessage}</div>
            ) : null}
          </div>

          <div style={{ marginTop: 'var(--sl-space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--sl-space-3)' }}>
            <Dialog.Close asChild>
              <Button tone="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button tone={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={confirmDisabled}>
              {loading ? 'Memproses...' : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
