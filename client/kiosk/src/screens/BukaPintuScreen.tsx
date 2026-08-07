import { DoorTransition } from '@smartbox/ui';

/**
 * TODO (Epic 5, Gateway Hardware/MQTT belum ada): saat backend beneran
 * publish perintah buka pintu ke unit, layar ini masih menampilkan animasi
 * "terbuka" begitu API sukses — BUKAN konfirmasi hardware sungguhan
 * (lihat catatan sama di server/backend/src/kiosk/kiosk-sewa.service.ts).
 */
export function BukaPintuScreen({
  nomorLoker,
  label = 'Silakan simpan barang Anda',
}: {
  nomorLoker?: string;
  label?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <DoorTransition open id={nomorLoker ?? '—'} label={label} />
    </div>
  );
}
