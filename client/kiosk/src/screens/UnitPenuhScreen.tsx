import { KioskButton } from '@smartbox/ui';

export function UnitPenuhScreen({ onKembali }: { onKembali: () => void }) {
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
      <div style={{ fontSize: 'var(--sl-kiosk-fs-title)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
        Unit Ini Penuh
      </div>
      <div style={{ fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-kiosk-fs-body)', color: 'var(--sl-text-muted)', maxWidth: 600 }}>
        Semua loker sedang terisi. Silakan coba lagi nanti atau cari unit lain di lokasi ini.
      </div>
      <KioskButton tone="neutral" size="lg" onClick={onKembali}>
        Kembali
      </KioskButton>
    </div>
  );
}
