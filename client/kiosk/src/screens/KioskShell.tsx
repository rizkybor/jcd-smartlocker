import type { ReactNode } from 'react';
import { StepProgress } from '@smartbox/ui';

/** Dipakai kalau caller tidak kirim `steps` — konteks alur Sewa. */
export const SEWA_STEPS = ['Nomor HP', 'Email', 'Durasi', 'Bayar', 'Ambil Barang'];
/** Step bar konteks alur Ambil Barang (§5.2) — dipakai NomorHpScreen dkk. */
export const AMBIL_STEPS = ['Nomor HP', 'Verifikasi OTP', 'Buka Pintu'];

/**
 * Layout bersama semua layar alur sewa/ambil selain Idle (yang full-bleed).
 * Kanvas 600×1024 (portrait) — lebar adalah sumbu sempit (§13.1 design
 * system, SMB-801 revisi kedua), jadi step bar dibuat compact & konten
 * disusun vertikal, tidak lagi split kiri-kanan seperti asumsi landscape.
 * `steps` WAJIB dikirim eksplisit oleh caller kalau `step` dipakai di luar
 * konteks alur Sewa (mis. NomorHpScreen dipakai ulang oleh alur Ambil
 * Barang dengan label step yang beda) — default SEWA_STEPS supaya caller
 * lama tidak perlu berubah.
 */
export function KioskShell({
  step,
  steps = SEWA_STEPS,
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
        gap: 'var(--sl-space-4)',
        background: 'var(--sl-surface-kiosk)',
      }}
    >
      {typeof step === 'number' ? <StepProgress steps={steps} current={step} compact /> : null}
      {title ? (
        <div>
          <div style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-kiosk-fs-caption)', color: 'var(--sl-text-muted)', marginTop: 4 }}>
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
