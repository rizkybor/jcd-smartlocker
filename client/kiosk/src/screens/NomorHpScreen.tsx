import { KioskButton, Numpad } from '@smartbox/ui';
import { KioskShell } from './KioskShell';

export function NomorHpScreen({
  nomorHp,
  onChange,
  onLanjut,
  onKembali,
  valid,
}: {
  nomorHp: string;
  onChange: (value: string) => void;
  onLanjut: () => void;
  onKembali: () => void;
  valid: boolean;
}) {
  return (
    <KioskShell step={0} title="Masukkan Nomor HP Anda" subtitle="Dipakai untuk ambil barang nanti — awalan 08.">
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
