import { KioskButton, Icon } from '@smartbox/ui';

export function BayarGagalScreen({ onUlangi, onBatal }: { onUlangi: () => void; onBatal: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 'var(--sl-space-6)',
        fontFamily: 'var(--sl-font-display)',
        textAlign: 'center',
        padding: 'var(--sl-kiosk-pad)',
      }}
    >
      <Icon name="circle-alert" size={64} color="var(--sl-status-offline)" label="Pembayaran gagal" />
      <div style={{ fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
        QR Sudah Kedaluwarsa
      </div>
      <div style={{ fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-kiosk-fs-body)', color: 'var(--sl-text-muted)', maxWidth: 600 }}>
        Waktu pembayaran habis atau pembayaran gagal diproses. Silakan pilih durasi lagi untuk mendapat QR baru.
      </div>
      <div style={{ display: 'flex', gap: 'var(--sl-touch-gap)' }}>
        <KioskButton tone="primary" size="lg" onClick={onUlangi}>
          Coba Lagi
        </KioskButton>
        <KioskButton tone="neutral" size="lg" onClick={onBatal}>
          Batalkan
        </KioskButton>
      </div>
    </div>
  );
}
