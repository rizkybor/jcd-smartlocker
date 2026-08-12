import type { ReactNode } from 'react';
import { StepProgress } from '@smartbox/ui';
import i18n from '../i18n';

/**
 * Dipakai kalau caller tidak kirim `steps` — konteks alur Sewa/Ambil.
 * Fungsi (bukan konstanta) supaya selalu baca locale aktif saat dipanggil
 * (SMB-1002, docs/PRD-Smartbox.md §7.2) — dipakai di luar body komponen
 * (default parameter, module-level export) jadi tidak bisa pakai hook
 * `useTranslation`.
 */
export const sewaSteps = (): string[] => i18n.t('steps.sewa', { returnObjects: true }) as string[];
export const ambilSteps = (): string[] => i18n.t('steps.ambil', { returnObjects: true }) as string[];

/**
 * Layout bersama semua layar alur sewa/ambil selain Idle (yang full-bleed).
 * Kanvas 600×1024 (portrait) — lebar adalah sumbu sempit (§13.1 design
 * system, SMB-801 revisi kedua), jadi step bar dibuat compact & konten
 * disusun vertikal, tidak lagi split kiri-kanan seperti asumsi landscape.
 * `steps` WAJIB dikirim eksplisit oleh caller kalau `step` dipakai di luar
 * konteks alur Sewa (mis. NomorHpScreen dipakai ulang oleh alur Ambil
 * Barang dengan label step yang beda) — default `sewaSteps()` supaya caller
 * lama tidak perlu berubah.
 */
export function KioskShell({
  step,
  steps = sewaSteps(),
  title,
  subtitle,
  children,
  footer,
}: {
  step?: number;
  steps?: string[];
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 'var(--sl-kiosk-pad)',
        boxSizing: 'border-box',
        gap: 'var(--sl-space-6)',
        background: 'var(--sl-surface-kiosk)',
        // Transisi masuk halus per pindah layar (§ "experience design yang
        // menarik") — screen di-remount tiap state machine pindah state
        // (App.tsx render kondisional per `state.matches(...)`), jadi
        // animasi ini otomatis muncul sekali per pindah langkah, bukan
        // berulang tiap re-render biasa (mis. tiap ketik Numpad).
        animation: 'sl-fade-up var(--sl-dur-slow) var(--sl-ease-out) both',
      }}
    >
      {typeof step === 'number' ? <StepProgress steps={steps} current={step} compact /> : null}
      {title ? (
        <div>
          <div
            style={{
              fontFamily: 'var(--sl-font-display)',
              fontSize: 'var(--sl-kiosk-fs-title)',
              fontWeight: 'var(--sl-fw-bold)',
              color: 'var(--sl-text-strong)',
              letterSpacing: 'var(--sl-ls-tight)',
              lineHeight: 'var(--sl-lh-tight)',
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontFamily: 'var(--sl-font-body)',
                fontSize: 'var(--sl-kiosk-fs-caption)',
                color: 'var(--sl-text-muted)',
                marginTop: 'var(--sl-space-2)',
                lineHeight: 'var(--sl-lh-snug)',
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
        {children}
      </div>
      {footer}
    </div>
  );
}
