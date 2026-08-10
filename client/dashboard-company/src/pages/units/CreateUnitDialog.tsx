import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, Field } from '@smartbox/ui';
import { companyApi, ApiError, type Lokasi } from '../../api/client';

type DurasiRow = { durasiJam: string; harga: string };

const DIALOG_STYLE = {
  content: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '92vw',
    maxWidth: 520,
    maxHeight: '86vh',
    overflowY: 'auto' as const,
    background: '#fff',
    borderRadius: 'var(--sl-radius-lg)',
    boxShadow: 'var(--sl-elev-5)',
    padding: 'var(--sl-space-6)',
    fontFamily: 'var(--sl-font-body)',
  },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(11,27,69,.45)' },
};

export function CreateUnitDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [lokasiId, setLokasiId] = useState('');
  const [kodeUnit, setKodeUnit] = useState('');
  const [varianKompartemen, setVarianKompartemen] = useState('');
  const [jumlahLoker, setJumlahLoker] = useState('6');
  const [modePemakaian, setModePemakaian] = useState<'BERBAYAR' | 'GRATIS'>('BERBAYAR');
  const [durasiRows, setDurasiRows] = useState<DurasiRow[]>([{ durasiJam: '1', harga: '5000' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    companyApi
      .lokasiList()
      .then((res) => {
        setLokasiList(res.data);
        setLokasiId((prev) => prev || res.data[0]?.id || '');
      })
      .catch(() => setError('Gagal memuat daftar lokasi.'));
  }, [open]);

  function updateDurasi(index: number, field: keyof DurasiRow, value: string) {
    setDurasiRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  const valid =
    lokasiId &&
    kodeUnit.trim().length > 0 &&
    Number(jumlahLoker) >= 1 &&
    durasiRows.every((r) => Number(r.durasiJam) >= 1 && Number(r.harga) >= 0);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await companyApi.units.create({
        lokasiId,
        kodeUnit: kodeUnit.trim(),
        varianKompartemen: varianKompartemen.trim() || undefined,
        jumlahLoker: Number(jumlahLoker),
        modePemakaian,
        durasiHarga: durasiRows.map((r) => ({ durasiJam: Number(r.durasiJam), harga: Number(r.harga) })),
      });
      setKodeUnit('');
      setVarianKompartemen('');
      setJumlahLoker('6');
      setDurasiRows([{ durasiJam: '1', harga: '5000' }]);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat unit.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={DIALOG_STYLE.overlay} />
        <Dialog.Content style={DIALOG_STYLE.content}>
          <Dialog.Title style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-20)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
            Tambah Unit Baru
          </Dialog.Title>

          <div style={{ marginTop: 'var(--sl-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
            <Field
              label="Lokasi"
              required
              options={lokasiList.map((l) => ({ value: l.id, label: l.nama }))}
              value={lokasiId}
              onChange={(e) => setLokasiId(e.target.value)}
            />
            <Field label="Kode Unit" required value={kodeUnit} onChange={(e) => setKodeUnit(e.target.value)} placeholder="mis. UNIT-02" />
            <Field label="Varian Kompartemen" value={varianKompartemen} onChange={(e) => setVarianKompartemen(e.target.value)} placeholder="opsional" />
            <Field label="Jumlah Loker" required type="number" value={jumlahLoker} onChange={(e) => setJumlahLoker(e.target.value)} />
            <Field
              label="Mode Pemakaian"
              required
              options={[
                { value: 'BERBAYAR', label: 'Berbayar' },
                { value: 'GRATIS', label: 'Gratis' },
              ]}
              value={modePemakaian}
              onChange={(e) => setModePemakaian(e.target.value as 'BERBAYAR' | 'GRATIS')}
            />

            <div>
              <span style={{ display: 'block', marginBottom: 6, fontSize: 'var(--sl-fs-13)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-text-body)' }}>
                Durasi & Harga
              </span>
              {durasiRows.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Field type="number" value={row.durasiJam} onChange={(e) => updateDurasi(i, 'durasiJam', e.target.value)} placeholder="Jam" />
                  <Field type="number" value={row.harga} onChange={(e) => updateDurasi(i, 'harga', e.target.value)} placeholder="Harga (Rp)" />
                  <Button
                    tone="ghost"
                    size="sm"
                    disabled={durasiRows.length <= 1}
                    onClick={() => setDurasiRows((rows) => rows.filter((_, ri) => ri !== i))}
                  >
                    Hapus
                  </Button>
                </div>
              ))}
              <Button tone="outline" size="sm" onClick={() => setDurasiRows((rows) => [...rows, { durasiJam: '', harga: '' }])}>
                + Tambah Durasi
              </Button>
            </div>

            {error ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-offline-strong)' }}>{error}</div> : null}
          </div>

          <div style={{ marginTop: 'var(--sl-space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--sl-space-3)' }}>
            <Dialog.Close asChild>
              <Button tone="outline" disabled={submitting}>
                Batal
              </Button>
            </Dialog.Close>
            <Button onClick={handleSubmit} disabled={!valid || submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
