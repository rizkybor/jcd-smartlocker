import { KioskButton, SuccessBurst } from '@smartbox/ui';
import type { StrukResult } from '../api/client';
import { formatRupiah } from '../utils/format';

export function StrukScreen({ struk, onSelesai }: { struk: StrukResult | null; onSelesai: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 'var(--sl-space-6)',
        padding: 'var(--sl-kiosk-pad)',
      }}
    >
      <SuccessBurst title="Loker Siap Dipakai" detail={struk ? `Loker ${struk.nomorLoker}` : undefined} size={140} />
      {struk ? (
        <div
          style={{
            fontFamily: 'var(--sl-font-body)',
            fontSize: 'var(--sl-kiosk-fs-caption)',
            color: 'var(--sl-text-muted)',
            textAlign: 'center',
          }}
        >
          <div>ID Transaksi: {struk.idTransaksi}</div>
          <div>Durasi: {struk.durasiJam} jam · {formatRupiah(struk.nominal)}</div>
          {struk.berlakuSampai ? <div>Berlaku sampai: {struk.berlakuSampai}</div> : null}
        </div>
      ) : null}
      <KioskButton tone="primary" size="lg" onClick={onSelesai}>
        Selesai
      </KioskButton>
    </div>
  );
}
