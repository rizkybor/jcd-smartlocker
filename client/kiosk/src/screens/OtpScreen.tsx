import { KioskButton, Numpad } from '@smartbox/ui';
import { KioskShell, AMBIL_STEPS } from './KioskShell';

/** Alur Ambil Barang langkah 3 (§5.2) — kode OTP 6 digit, berlaku 5 menit. */
export function OtpScreen({
  kode,
  onChange,
  onVerifikasi,
  onKirimUlang,
  onKembali,
  valid,
  errorMessage,
}: {
  kode: string;
  onChange: (value: string) => void;
  onVerifikasi: () => void;
  onKirimUlang: () => void;
  onKembali: () => void;
  valid: boolean;
  errorMessage: string | null;
}) {
  return (
    <KioskShell step={1} steps={AMBIL_STEPS} title="Masukkan Kode OTP" subtitle="Kode 6 digit sudah dikirim, berlaku 5 menit.">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--sl-space-6)' }}>
        <Numpad value={kode} onChange={onChange} length={6} />
        {errorMessage ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--sl-status-offline-strong)',
              fontFamily: 'var(--sl-font-body)',
              fontSize: 'var(--sl-kiosk-fs-caption)',
            }}
          >
            {errorMessage}
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 'var(--sl-space-4)' }}>
          <KioskButton tone="neutral" size="md" onClick={onKembali}>
            Kembali
          </KioskButton>
          <KioskButton tone="primary" size="lg" disabled={!valid} onClick={onVerifikasi}>
            Verifikasi
          </KioskButton>
        </div>
        <KioskButton tone="neutral" size="md" onClick={onKirimUlang}>
          Kirim Ulang Kode
        </KioskButton>
      </div>
    </KioskShell>
  );
}
