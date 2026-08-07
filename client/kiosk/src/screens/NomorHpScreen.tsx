import { KioskButton, Numpad } from '@smartbox/ui';
import { KioskShell, SEWA_STEPS } from './KioskShell';

/**
 * Dipakai ulang oleh dua alur (Sewa langkah 1, Ambil Barang langkah 1) —
 * `steps`/`title`/`subtitle` dikirim caller (App.tsx) supaya step bar &
 * copy sesuai konteksnya masing-masing.
 */
export function NomorHpScreen({
  nomorHp,
  onChange,
  onLanjut,
  onKembali,
  valid,
  steps = SEWA_STEPS,
  title = 'Masukkan Nomor HP Anda',
  subtitle = 'Dipakai untuk ambil barang nanti — awalan 08.',
}: {
  nomorHp: string;
  onChange: (value: string) => void;
  onLanjut: () => void;
  onKembali: () => void;
  valid: boolean;
  steps?: string[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <KioskShell step={0} steps={steps} title={title} subtitle={subtitle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--sl-space-6)' }}>
        <Numpad value={nomorHp} onChange={onChange} length={13} />
        <div style={{ display: 'flex', gap: 'var(--sl-space-4)' }}>
          <KioskButton tone="neutral" size="md" onClick={onKembali}>
            Kembali
          </KioskButton>
          <KioskButton tone="primary" size="lg" disabled={!valid} onClick={onLanjut}>
            Lanjut
          </KioskButton>
        </div>
      </div>
    </KioskShell>
  );
}
