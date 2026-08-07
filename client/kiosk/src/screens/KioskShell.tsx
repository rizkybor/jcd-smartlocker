import type { ReactNode } from 'react';
import { StepProgress } from '@smartbox/ui';

const SEWA_STEPS = ['Nomor HP', 'Durasi', 'Bayar', 'Ambil Barang'];

/**
 * Layout bersama semua layar alur sewa selain Idle (yang full-bleed).
 * Kanvas 600×1024 (portrait) — lebar adalah sumbu sempit (§13.1 design
 * system, SMB-801 revisi kedua), jadi step bar dibuat compact & konten
 * disusun vertikal, tidak lagi split kiri-kanan seperti asumsi landscape.
 */
export function KioskShell({
  step,
  title,
  subtitle,
  children,
  footer,
}: {
  step?: number;
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
      {typeof step === 'number' ? <StepProgress steps={SEWA_STEPS} current={step} compact /> : null}
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
