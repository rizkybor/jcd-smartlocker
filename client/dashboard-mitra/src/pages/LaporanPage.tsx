import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, Button, Field, StatCard, StatusBadge, useToast, nomorUrut, type DataTableColumn } from '@smartbox/ui';
import { mitraApi, ApiError, type Lokasi, type LaporanFilter, type LaporanResult, type LaporanTransaksiRow } from '../api/client';

function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal);
}

const STATUS_MAP: Record<LaporanTransaksiRow['statusBayar'], 'tersedia' | 'terisi' | 'offline'> = {
  PAID: 'tersedia',
  PENDING: 'terisi',
  FAILED: 'offline',
  EXPIRED: 'offline',
};

export function LaporanPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [lokasiOptions, setLokasiOptions] = useState<Lokasi[]>([]);
  const [filter, setFilter] = useState<LaporanFilter>({});
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<LaporanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  // Ambil daftar lokasi milik mitra ini dari respons unit (tidak ada
  // endpoint lokasi terpisah di API mitra) — cuma dipakai untuk dropdown
  // filter kalau mitra punya >1 lokasi.
  useEffect(() => {
    mitraApi
      .units(1, 100)
      .then((res) => {
        const unique = new Map(res.data.map((u) => [u.lokasi.id, u.lokasi]));
        setLokasiOptions([...unique.values()]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    mitraApi
      .laporan(filter, page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('laporanPage.gagalMuatLaporan')));
  }, [filter, page, t]);

  async function handleExport() {
    setExporting(true);
    setExportUrl(null);
    setError(null);
    try {
      const res = await mitraApi.export(filter);
      setExportUrl(res.data.url);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('laporanPage.gagalEksporLaporan');
      setError(message);
      toast({ title: t('laporanPage.eksporGagalToast'), description: message, tone: 'error' });
    } finally {
      setExporting(false);
    }
  }

  const columns: DataTableColumn<LaporanTransaksiRow>[] = [
    { header: t('common.no'), width: 1, render: (_r, i) => nomorUrut(i, result?.meta) },
    { header: t('laporanPage.kolom.idTransaksi'), render: (r) => r.idTransaksi },
    { header: t('laporanPage.kolom.tanggal'), render: (r) => r.tanggal },
    { header: t('laporanPage.kolom.lokasi'), render: (r) => r.lokasiNama },
    { header: t('laporanPage.kolom.loker'), render: (r) => r.nomorLoker },
    { header: t('laporanPage.kolom.nominal'), align: 'right', numeric: true, render: (r) => formatRupiah(r.nominal) },
    { header: t('laporanPage.kolom.status'), render: (r) => <StatusBadge status={STATUS_MAP[r.statusBayar]}>{r.statusBayar}</StatusBadge> },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        {t('laporanPage.judul')}
      </h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sl-space-3)', alignItems: 'flex-end', marginBottom: 'var(--sl-space-5)' }}>
        <Field
          label={t('laporanPage.dariTanggal')}
          type="date"
          value={filter.tanggalMulai ?? ''}
          onChange={(e) => {
            setFilter({ ...filter, tanggalMulai: e.target.value || undefined });
            setPage(1);
          }}
          style={{ width: 170 }}
        />
        <Field
          label={t('laporanPage.sampaiTanggal')}
          type="date"
          value={filter.tanggalSelesai ?? ''}
          onChange={(e) => {
            setFilter({ ...filter, tanggalSelesai: e.target.value || undefined });
            setPage(1);
          }}
          style={{ width: 170 }}
        />
        {lokasiOptions.length > 1 ? (
          <Field
            label={t('laporanPage.lokasi')}
            options={[{ value: '', label: t('laporanPage.semuaLokasi') }, ...lokasiOptions.map((l) => ({ value: l.id, label: l.nama }))]}
            value={filter.lokasiId ?? ''}
            onChange={(e) => {
              setFilter({ ...filter, lokasiId: e.target.value || undefined });
              setPage(1);
            }}
            style={{ width: 200 }}
          />
        ) : null}
        <Button tone="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? t('laporanPage.menyiapkan') : t('laporanPage.ekspor')}
        </Button>
      </div>

      {exportUrl ? (
        <Panel style={{ marginBottom: 'var(--sl-space-5)' }}>
          {t('laporanPage.fileSiap')}{' '}
          <a href={exportUrl} target="_blank" rel="noreferrer">
            {t('laporanPage.unduhCsv')}
          </a>{' '}
          {t('laporanPage.tautanBerlaku')}
        </Panel>
      ) : null}

      {result ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sl-space-5)', marginBottom: 'var(--sl-space-6)' }}>
          <StatCard label={t('laporanPage.jumlahTransaksi')} value={result.bagiHasil.jumlahTransaksi} accent="primary" />
          <StatCard label={t('laporanPage.totalNominal')} value={formatRupiah(result.bagiHasil.totalNominal)} accent="primary" />
          <StatCard label={t('laporanPage.bagiHasilAnda')} value={formatRupiah(result.bagiHasil.totalBagiHasilMitra)} accent="available" />
        </div>
      ) : null}

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
        ) : result.data.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('laporanPage.tidakAdaTransaksi')}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('laporanPage.itemLabel') }}
          />
        )}
      </Panel>
    </div>
  );
}
