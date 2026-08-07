import { KioskButton } from '@smartbox/ui';

export function MenuScreen({ onSewa }: { onSewa: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 'var(--sl-space-8)',
        fontFamily: 'var(--sl-font-display)',
      }}
    >
      <div style={{ fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
        Mau ngapain hari ini?
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-touch-gap)' }}>
        <KioskButton tone="primary" size="xl" onClick={onSewa}>
          Sewa Loker
        </KioskButton>
        {/* Ambil Barang — Epic 4, belum dibangun. */}
        <KioskButton tone="neutral" size="xl" disabled>
          Ambil Barang
        </KioskButton>
      </div>
    </div>
  );
}
