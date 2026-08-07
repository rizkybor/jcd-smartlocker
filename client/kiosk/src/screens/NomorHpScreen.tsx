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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sl-space-10)' }}>
        <Numpad value={nomorHp} onChange={onChange} length={13} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
          <KioskButton tone="primary" size="lg" disabled={!valid} onClick={onLanjut}>
            Lanjut
          </KioskButton>
          <KioskButton tone="neutral" size="md" onClick={onKembali}>
            Kembali
          </KioskButton>
        </div>
      </div>
    </KioskShell>
  );
}
