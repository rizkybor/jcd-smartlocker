import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Panel, Button, Field, StatusBadge, DataTable, ConfirmDialog, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type UnitDetail, type Loker, type LokerStatus, type SesiTransaksiRingkas } from '../api/client';
import { formatTanggalLokasi } from '../utils/formatTanggal';

type DurasiRow = { id?: string; durasiJam: string; harga: string };

function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal);
}

export function UnitDetailPage() {
  const { t } = useTranslation();
  const LOKER_STATUS_OPTIONS: { value: LokerStatus; label: string }[] = [
    { value: 'TERSEDIA', label: t('unitDetailPage.statusLoker.tersedia') },
    { value: 'TERISI', label: t('unitDetailPage.statusLoker.terisi') },
    { value: 'MAINTENANCE', label: t('unitDetailPage.statusLoker.maintenance') },
    { value: 'OFFLINE', label: t('unitDetailPage.statusLoker.offline') },
    { value: 'NONAKTIF', label: t('unitDetailPage.statusLoker.nonaktif') },
  ];
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Form konfigurasi ---
  const [varianKompartemen, setVarianKompartemen] = useState('');
  const [modePemakaian, setModePemakaian] = useState<'BERBAYAR' | 'GRATIS'>('BERBAYAR');
  const [durasiRows, setDurasiRows] = useState<DurasiRow[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSaved, setConfigSaved] = useState(false);

  // --- Buka paksa ---
  const [bukaPaksaLoker, setBukaPaksaLoker] = useState<Loker | null>(null);
  const [bukaPaksaAlasan, setBukaPaksaAlasan] = useState('');
  const [bukaPaksaLoading, setBukaPaksaLoading] = useState(false);
  const [bukaPaksaError, setBukaPaksaError] = useState<string | null>(null);

  // --- Nonaktifkan unit ---
  const [nonaktifkanOpen, setNonaktifkanOpen] = useState(false);
  const [nonaktifkanAlasan, setNonaktifkanAlasan] = useState('');
  const [nonaktifkanLoading, setNonaktifkanLoading] = useState(false);
  const [nonaktifkanError, setNonaktifkanError] = useState<string | null>(null);

  function reload() {
    if (!id) return;
    companyApi.units
      .detail(id)
      .then((res) => {
        setUnit(res.data);
        setVarianKompartemen(res.data.varianKompartemen ?? '');
        setModePemakaian(res.data.modePemakaian);
        setDurasiRows(
          res.data.durasiHarga
            .filter((d) => d.aktif)
            .map((d) => ({ id: d.id, durasiJam: String(d.durasiJam), harga: String(d.harga) })),
        );
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : t('unitDetailPage.gagalMuat')));
  }

  useEffect(reload, [id, t]);

  function updateDurasi(index: number, field: 'durasiJam' | 'harga', value: string) {
    setDurasiRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  async function handleSaveConfig() {
    if (!id) return;
    setSavingConfig(true);
    setConfigError(null);
    setConfigSaved(false);
    try {
      await companyApi.units.update(id, {
        varianKompartemen: varianKompartemen.trim() || undefined,
        modePemakaian,
        durasiHarga: durasiRows.map((r) => ({
          id: r.id,
          durasiJam: Number(r.durasiJam),
          harga: Number(r.harga),
        })),
      });
      setConfigSaved(true);
      reload();
    } catch (err) {
      setConfigError(err instanceof ApiError ? err.message : t('unitDetailPage.gagalSimpanConfig'));
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleLokerStatusChange(loker: Loker, status: LokerStatus) {
    if (status === loker.status) return;
    try {
      await companyApi.lokerUpdateStatus(loker.id, status);
      reload();
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t('unitDetailPage.gagalUbahStatus'));
    }
  }

  async function handleBukaPaksaConfirm() {
    if (!id || !bukaPaksaLoker) return;
    setBukaPaksaLoading(true);
    setBukaPaksaError(null);
    try {
      await companyApi.units.bukaPaksa(id, bukaPaksaLoker.id, bukaPaksaAlasan);
      setBukaPaksaLoker(null);
      setBukaPaksaAlasan('');
    } catch (err) {
      setBukaPaksaError(err instanceof ApiError ? err.message : t('unitDetailPage.gagalBukaPaksa'));
    } finally {
      setBukaPaksaLoading(false);
    }
  }

  async function handleNonaktifkanConfirm() {
    if (!id) return;
    setNonaktifkanLoading(true);
    setNonaktifkanError(null);
    try {
      await companyApi.units.remove(id, nonaktifkanAlasan);
      navigate('/units');
    } catch (err) {
      setNonaktifkanError(err instanceof ApiError ? err.message : t('unitDetailPage.gagalNonaktifkan'));
    } finally {
      setNonaktifkanLoading(false);
    }
  }

  if (loadError) {
    return (
      <Panel>
        <div style={{ color: 'var(--sl-status-offline-strong)' }}>{loadError}</div>
      </Panel>
    );
  }
  if (!unit) return <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>;

  const lokerColumns: DataTableColumn<Loker>[] = [
    { header: t('unitDetailPage.kolomNomor'), render: (l) => l.nomorLoker },
    {
      header: t('unitDetailPage.kolomStatus'),
      render: (l) => (
        <select
          value={l.status}
          onChange={(e) => void handleLokerStatusChange(l, e.target.value as LokerStatus)}
          style={{ font: 'var(--sl-fw-medium) var(--sl-fs-13)/1 var(--sl-font-body)', padding: '4px 8px', borderRadius: 'var(--sl-radius-sm)', border: 'var(--sl-border-w) solid var(--sl-border-strong)' }}
        >
          {LOKER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: '',
      align: 'right',
      render: (l) => (
        <Button tone="danger" size="sm" onClick={() => setBukaPaksaLoker(l)}>
          {t('unitDetailPage.bukaPaksa')}
        </Button>
      ),
    },
  ];

  const riwayatColumns: DataTableColumn<SesiTransaksiRingkas>[] = [
    { header: t('unitDetailPage.kolomIdTransaksi'), render: (s) => s.idTransaksi },
    { header: t('unitDetailPage.kolomLoker'), render: (s) => s.loker.nomorLoker },
    {
      header: t('unitDetailPage.kolomStatusBayar'),
      render: (s) => <StatusBadge status={s.statusBayar === 'PAID' ? 'tersedia' : s.statusBayar === 'PENDING' ? 'terisi' : 'offline'}>{s.statusBayar}</StatusBadge>,
    },
    { header: t('unitDetailPage.kolomNominal'), align: 'right', numeric: true, render: (s) => formatRupiah(s.nominal) },
    { header: t('unitDetailPage.kolomTanggal'), render: (s) => formatTanggalLokasi(s.createdAt, unit.lokasi.timezone) },
  ];

  const mitraNames = unit.lokasi.mitraLokasi.map((ml) => ml.mitra.nama).join(', ') || '—';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sl-space-4)', marginBottom: 'var(--sl-space-2)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          {unit.kodeUnit}
        </h1>
        <StatusBadge status={unit.aktif ? 'tersedia' : 'nonaktif'}>{unit.aktif ? t('common.aktif') : t('common.nonaktif')}</StatusBadge>
      </div>
      <div style={{ color: 'var(--sl-text-muted)', marginBottom: 'var(--sl-space-6)' }}>
        {t('unitDetailPage.subjudul', { lokasi: unit.lokasi.nama, mitra: mitraNames })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-6)' }}>
        <Panel>
          <h2 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-16)', fontWeight: 'var(--sl-fw-bold)', marginTop: 0 }}>{t('unitDetailPage.konfigurasi')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)', maxWidth: 480 }}>
            <Field label={t('unitDetailPage.varianKompartemen')} value={varianKompartemen} onChange={(e) => setVarianKompartemen(e.target.value)} />
            <Field
              label={t('unitDetailPage.modePemakaian')}
              options={[
                { value: 'BERBAYAR', label: t('common.modePemakaian.berbayar') },
                { value: 'GRATIS', label: t('common.modePemakaian.gratis') },
              ]}
              value={modePemakaian}
              onChange={(e) => setModePemakaian(e.target.value as 'BERBAYAR' | 'GRATIS')}
            />
            <div>
              <span style={{ display: 'block', marginBottom: 6, fontSize: 'var(--sl-fs-13)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-text-body)' }}>
                {t('unitDetailPage.durasiHarga')}
              </span>
              {durasiRows.map((row, i) => (
                <div key={row.id ?? i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Field type="number" value={row.durasiJam} onChange={(e) => updateDurasi(i, 'durasiJam', e.target.value)} placeholder={t('unitDetailPage.placeholderJam')} />
                  <Field type="number" value={row.harga} onChange={(e) => updateDurasi(i, 'harga', e.target.value)} placeholder={t('unitDetailPage.placeholderHarga')} />
                  <Button tone="ghost" size="sm" onClick={() => setDurasiRows((rows) => rows.filter((_, ri) => ri !== i))}>
                    {t('common.hapus')}
                  </Button>
                </div>
              ))}
              <Button tone="outline" size="sm" onClick={() => setDurasiRows((rows) => [...rows, { durasiJam: '', harga: '' }])}>
                {t('unitDetailPage.tambahDurasi')}
              </Button>
            </div>
            {configError ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-offline-strong)' }}>{configError}</div> : null}
            {configSaved ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-available-strong)' }}>{t('common.tersimpan')}</div> : null}
            <div>
              <Button onClick={handleSaveConfig} disabled={savingConfig}>
                {savingConfig ? t('common.menyimpan') : t('unitDetailPage.simpanKonfigurasi')}
              </Button>
            </div>
          </div>
        </Panel>

        <Panel>
          <h2 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-16)', fontWeight: 'var(--sl-fw-bold)', marginTop: 0 }}>
            {t('unitDetailPage.lokerHeading', { jumlah: unit.lokers.length })}
          </h2>
          <DataTable columns={lokerColumns} rows={unit.lokers} striped />
        </Panel>

        <Panel>
          <h2 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-16)', fontWeight: 'var(--sl-fw-bold)', marginTop: 0 }}>
            {t('unitDetailPage.riwayatHeading')}
          </h2>
          {unit.riwayatTransaksi.length === 0 ? (
            <div style={{ color: 'var(--sl-text-muted)' }}>{t('unitDetailPage.kosongTransaksi')}</div>
          ) : (
            <DataTable columns={riwayatColumns} rows={unit.riwayatTransaksi} striped />
          )}
        </Panel>

        {unit.aktif ? (
          <Panel style={{ borderColor: 'var(--sl-status-offline)' }}>
            <h2 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-16)', fontWeight: 'var(--sl-fw-bold)', marginTop: 0, color: 'var(--sl-status-offline-strong)' }}>
              {t('unitDetailPage.zonaBerbahaya')}
            </h2>
            <p style={{ color: 'var(--sl-text-muted)', marginTop: 0 }}>{t('unitDetailPage.zonaBerbahayaDeskripsi')}</p>
            <Button tone="danger" onClick={() => setNonaktifkanOpen(true)}>
              {t('unitDetailPage.nonaktifkanUnit')}
            </Button>
          </Panel>
        ) : null}
      </div>

      <ConfirmDialog
        open={!!bukaPaksaLoker}
        onOpenChange={(open) => {
          if (!open) {
            setBukaPaksaLoker(null);
            setBukaPaksaAlasan('');
            setBukaPaksaError(null);
          }
        }}
        title={t('unitDetailPage.bukaPaksaTitle', { nomor: bukaPaksaLoker?.nomorLoker ?? '' })}
        description={t('unitDetailPage.bukaPaksaDeskripsi')}
        tone="danger"
        confirmLabel={t('unitDetailPage.bukaPaksa')}
        requireReason
        reasonValue={bukaPaksaAlasan}
        onReasonChange={setBukaPaksaAlasan}
        loading={bukaPaksaLoading}
        errorMessage={bukaPaksaError}
        onConfirm={handleBukaPaksaConfirm}
      />

      <ConfirmDialog
        open={nonaktifkanOpen}
        onOpenChange={(open) => {
          setNonaktifkanOpen(open);
          if (!open) {
            setNonaktifkanAlasan('');
            setNonaktifkanError(null);
          }
        }}
        title={t('unitDetailPage.nonaktifkanTitle', { kode: unit.kodeUnit })}
        description={t('unitDetailPage.nonaktifkanDeskripsi')}
        tone="danger"
        confirmLabel={t('common.nonaktifkan')}
        requireReason
        reasonValue={nonaktifkanAlasan}
        onReasonChange={setNonaktifkanAlasan}
        loading={nonaktifkanLoading}
        errorMessage={nonaktifkanError}
        onConfirm={handleNonaktifkanConfirm}
      />
    </div>
  );
}
