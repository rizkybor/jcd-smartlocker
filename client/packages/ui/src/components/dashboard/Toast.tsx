import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** ms sebelum hilang otomatis — default 5000. */
  duration?: number;
};

type ToastItem = ToastInput & { id: number };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLE: Record<ToastTone, { border: string; dot: string }> = {
  success: { border: 'var(--sl-status-available)', dot: 'var(--sl-status-available)' },
  error: { border: 'var(--sl-status-offline)', dot: 'var(--sl-status-offline)' },
  info: { border: 'var(--sl-secondary)', dot: 'var(--sl-secondary)' },
};

/**
 * Notifikasi non-blocking (docs/PRD-Smartbox.md §9.3, §13.2, SMB-803) —
 * untuk feedback sukses/gagal aksi yang tidak butuh modal blocking (beda
 * dari ConfirmDialog, yang memang harus di-acknowledge). Bungkus root app
 * dengan `<ToastProvider>`, panggil `useToast().toast({...})` dari mana
 * saja di dalamnya.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, tone: 'info', duration: 5000, ...input }]);
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {items.map((it) => {
          const tone = it.tone ?? 'info';
          const s = TONE_STYLE[tone];
          return (
            <ToastPrimitive.Root
              key={it.id}
              duration={it.duration}
              onOpenChange={(open) => {
                if (!open) remove(it.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--sl-space-3)',
                background: '#fff',
                borderLeft: `4px solid ${s.border}`,
                borderRadius: 'var(--sl-radius-md)',
                boxShadow: 'var(--sl-elev-4)',
                padding: 'var(--sl-space-4) var(--sl-space-5)',
                fontFamily: 'var(--sl-font-body)',
                minWidth: 280,
                maxWidth: 380,
              }}
            >
              <span aria-hidden="true" style={{ width: 8, height: 8, marginTop: 6, borderRadius: 'var(--sl-radius-pill)', background: s.dot, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <ToastPrimitive.Title style={{ fontSize: 'var(--sl-fs-14)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-text-strong)' }}>
                  {it.title}
                </ToastPrimitive.Title>
                {it.description ? (
                  <ToastPrimitive.Description style={{ marginTop: 2, fontSize: 'var(--sl-fs-13)', color: 'var(--sl-text-muted)' }}>
                    {it.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                aria-label="Tutup"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sl-text-faint)', fontSize: 16, lineHeight: 1, padding: 0 }}
              >
                ×
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport
          style={{
            position: 'fixed',
            bottom: 'var(--sl-space-6)',
            right: 'var(--sl-space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sl-space-3)',
            width: 'auto',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            zIndex: 9999,
          }}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast dipakai di luar <ToastProvider>.');
  return ctx;
}
