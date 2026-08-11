import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, Field } from '@smartbox/ui';
import { companyApi, ApiError, type Lokasi } from '../../api/client';

type DurasiRow = { durasiJam: string; harga: string };
type KategoriRow = { nama: string; ukuranWMm: string; ukuranHMm: string; jumlahLoker: string; durasiHarga: DurasiRow[] };

function kategoriKosong(): KategoriRow {
  return { nama: '', ukuranWMm: '', ukuranHMm: '', jumlahLoker: '6', durasiHarga: [{ durasiJam: '1', harga: '5000' }] };
}

const DIALOG_STYLE = {
  content: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '92vw',
    maxWidth: 560,
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

/**
 * Fitur harga & pilihan per ukuran loker (di luar cakupan PRD awal —
 * permintaan bisnis langsung, §8.3 sudah mengasumsikan satu unit fisik
 * BISA punya loker beragam ukuran): satu unit dibuat sekaligus dengan
 * >=1 KATEGORI ukuran loker, masing-masing dengan jumlah loker & daftar
 * durasi/harga SENDIRI — bukan satu daftar harga rata untuk semua loker.
 */
export function CreateUnitDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [lokasiId, setLokasiId] = useState('');
  const [kodeUnit, setKodeUnit] = useState('');
  const [varianKompartemen, setVarianKompartemen] = useState('');
  const [modePemakaian, setModePemakaian] = useState<'BERBAYAR' | 'GRATIS'>('BERBAYAR');
  const [kategoriRows, setKategoriRows] = useState<KategoriRow[]>([kategoriKosong()]);
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
      .catch(() => setError(t('createUnitDialog.gagalMuatLokasi')));
  }, [open, t]);

  function updateKategori(index: number, patch: Partial<KategoriRow>) {
    setKategoriRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function updateDurasi(kategoriIndex: number, durasiIndex: number, field: keyof DurasiRow, value: string) {
    setKategoriRows((rows) =>
      rows.map((r, i) =>
        i === kategoriIndex
          ? { ...r, durasiHarga: r.durasiHarga.map((d, di) => (di === durasiIndex ? { ...d, [field]: value } : d)) }
          : r,
      ),
    );
  }

  const valid =
    lokasiId &&
    kodeUnit.trim().length > 0 &&
    kategoriRows.length > 0 &&
    kategoriRows.every(
      (k) =>
        k.nama.trim().length > 0 &&
        Number(k.jumlahLoker) >= 1 &&
        k.durasiHarga.length > 0 &&
        k.durasiHarga.every((d) => Number(d.durasiJam) >= 1 && Number(d.harga) >= 0),
    );

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await companyApi.units.create({
        lokasiId,
        kodeUnit: kodeUnit.trim(),
        varianKompartemen: varianKompartemen.trim() || undefined,
        modePemakaian,
        kategori: kategoriRows.map((k) => ({
          nama: k.nama.trim(),
          ukuranWMm: k.ukuranWMm ? Number(k.ukuranWMm) : undefined,
          ukuranHMm: k.ukuranHMm ? Number(k.ukuranHMm) : undefined,
          jumlahLoker: Number(k.jumlahLoker),
          durasiHarga: k.durasiHarga.map((d) => ({ durasiJam: Number(d.durasiJam), harga: Number(d.harga) })),
        })),
      });
      setKodeUnit('');
      setVarianKompartemen('');
      setKategoriRows([kategoriKosong()]);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('createUnitDialog.gagalSimpan'));
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
            {t('createUnitDialog.judul')}
          </Dialog.Title>

          <div style={{ marginTop: 'var(--sl-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
            <Field
              label={t('createUnitDialog.lokasi')}
              required
              options={lokasiList.map((l) => ({ value: l.id, label: l.nama }))}
              value={lokasiId}
              onChange={(e) => setLokasiId(e.target.value)}
            />
            <Field label={t('createUnitDialog.kodeUnit')} required value={kodeUnit} onChange={(e) => setKodeUnit(e.target.value)} placeholder={t('createUnitDialog.kodeUnitPlaceholder')} />
            <Field label={t('createUnitDialog.varianKompartemen')} value={varianKompartemen} onChange={(e) => setVarianKompartemen(e.target.value)} placeholder={t('common.opsional')} />
            <Field
              label={t('createUnitDialog.modePemakaian')}
              required
              options={[
                { value: 'BERBAYAR', label: t('common.modePemakaian.berbayar') },
                { value: 'GRATIS', label: t('common.modePemakaian.gratis') },
              ]}
              value={modePemakaian}
              onChange={(e) => setModePemakaian(e.target.value as 'BERBAYAR' | 'GRATIS')}
            />

            <div>
              <span style={{ display: 'block', marginBottom: 6, fontSize: 'var(--sl-fs-13)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-text-body)' }}>
                {t('createUnitDialog.kategoriUkuran')}
              </span>
              {kategoriRows.map((k, ki) => (
                <div key={ki} style={{ border: 'var(--sl-border-w) solid var(--sl-border-strong)', borderRadius: 'var(--sl-radius-md)', padding: 'var(--sl-space-3)', marginBottom: 'var(--sl-space-3)' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Field value={k.nama} onChange={(e) => updateKategori(ki, { nama: e.target.value })} placeholder={t('createUnitDialog.namaKategoriPlaceholder')} />
                    <Button tone="ghost" size="sm" disabled={kategoriRows.length <= 1} onClick={() => setKategoriRows((rows) => rows.filter((_, ri) => ri !== ki))}>
                      {t('common.hapus')}
                    </Button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Field type="number" value={k.ukuranWMm} onChange={(e) => updateKategori(ki, { ukuranWMm: e.target.value })} placeholder={t('createUnitDialog.ukuranWPlaceholder')} />
                    <Field type="number" value={k.ukuranHMm} onChange={(e) => updateKategori(ki, { ukuranHMm: e.target.value })} placeholder={t('createUnitDialog.ukuranHPlaceholder')} />
                    <Field type="number" required value={k.jumlahLoker} onChange={(e) => updateKategori(ki, { jumlahLoker: e.target.value })} placeholder={t('createUnitDialog.jumlahLoker')} />
                  </div>

                  <span style={{ display: 'block', marginBottom: 6, fontSize: 'var(--sl-fs-13)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-text-body)' }}>
                    {t('createUnitDialog.durasiHarga')}
                  </span>
                  {k.durasiHarga.map((row, di) => (
                    <div key={di} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <Field type="number" value={row.durasiJam} onChange={(e) => updateDurasi(ki, di, 'durasiJam', e.target.value)} placeholder={t('createUnitDialog.placeholderJam')} />
                      <Field type="number" value={row.harga} onChange={(e) => updateDurasi(ki, di, 'harga', e.target.value)} placeholder={t('createUnitDialog.placeholderHarga')} />
                      <Button
                        tone="ghost"
                        size="sm"
                        disabled={k.durasiHarga.length <= 1}
                        onClick={() => updateKategori(ki, { durasiHarga: k.durasiHarga.filter((_, ri) => ri !== di) })}
                      >
                        {t('common.hapus')}
                      </Button>
                    </div>
                  ))}
                  <Button tone="outline" size="sm" onClick={() => updateKategori(ki, { durasiHarga: [...k.durasiHarga, { durasiJam: '', harga: '' }] })}>
                    {t('createUnitDialog.tambahDurasi')}
                  </Button>
                </div>
              ))}
              <Button tone="outline" size="sm" onClick={() => setKategoriRows((rows) => [...rows, kategoriKosong()])}>
                {t('createUnitDialog.tambahKategori')}
              </Button>
            </div>

            {error ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-offline-strong)' }}>{error}</div> : null}
          </div>

          <div style={{ marginTop: 'var(--sl-space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--sl-space-3)' }}>
            <Dialog.Close asChild>
              <Button tone="outline" disabled={submitting}>
                {t('common.batal')}
              </Button>
            </Dialog.Close>
            <Button onClick={handleSubmit} disabled={!valid || submitting}>
              {submitting ? t('common.menyimpan') : t('common.simpan')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
