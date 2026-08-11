import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, useToast, nomorUrut, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type LaporanFilter, type LaporanBagiHasilRow } from '../api/client';
import { LaporanFilterBar } from './laporan/LaporanFilterBar';

function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal);
}

export function LaporanBagiHasilPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [filter, setFilter] = useState<LaporanFilter>({});
  const [rows, setRows] = useState<LaporanBagiHasilRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  useEffect(() => {
    companyApi.laporan
      .bagiHasil(filter)
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('laporanBagiHasilPage.gagalMuat')));
  }, [filter, t]);

  async function handleExport() {
    setExporting(true);
    setExportUrl(null);
    setError(null);
    try {
      const res = await companyApi.laporan.export('bagi-hasil', filter);
      setExportUrl(res.data.url);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('laporan.gagalEkspor');
      setError(message);
      toast({ title: t('laporan.eksporGagalToast'), description: message, tone: 'error' });
    } finally {
      setExporting(false);
    }
  }

  const columns: DataTableColumn<LaporanBagiHasilRow>[] = [
    { header: t('common.no'), width: 1, render: (_r, i) => nomorUrut(i) },
    { header: t('laporanBagiHasilPage.kolomMitra'), render: (r) => r.mitraNama },
    { header: t('laporanBagiHasilPage.kolomLokasi'), render: (r) => r.lokasiNama },
    { header: t('laporanBagiHasilPage.kolomPersentase'), align: 'right', render: (r) => (r.persentaseAktif !== null ? `${r.persentaseAktif}%` : '—') },
    { header: t('laporanBagiHasilPage.kolomJumlahTransaksi'), align: 'right', numeric: true, render: (r) => r.jumlahTransaksi },
    { header: t('laporanBagiHasilPage.kolomTotalNominal'), align: 'right', numeric: true, render: (r) => formatRupiah(r.totalNominal) },
    { header: t('laporanBagiHasilPage.kolomBagiHasilMitra'), align: 'right', numeric: true, render: (r) => formatRupiah(r.totalBagiHasilMitra) },
    { header: t('laporanBagiHasilPage.kolomBagiHasilSmartbox'), align: 'right', numeric: true, render: (r) => formatRupiah(r.totalBagiHasilSmartbox) },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        {t('laporanBagiHasilPage.judul')}
      </h1>
      <p style={{ color: 'var(--sl-text-muted)', marginTop: -16, marginBottom: 'var(--sl-space-6)' }}>
        {t('laporanBagiHasilPage.deskripsi')}
      </p>

      <LaporanFilterBar filter={filter} onChange={setFilter} onExport={handleExport} exporting={exporting} />

      {exportUrl ? (
        <Panel style={{ marginBottom: 'var(--sl-space-5)' }}>
          {t('laporan.fileSiap')}{' '}
          <a href={exportUrl} target="_blank" rel="noreferrer">
            {t('laporan.unduhCsv')}
          </a>{' '}
          {t('laporan.tautanBerlaku')}
        </Panel>
      ) : null}

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !rows ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
        ) : rows.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('laporanBagiHasilPage.kosong')}</div>
        ) : (
          <DataTable columns={columns} rows={rows} striped />
        )}
      </Panel>
    </div>
  );
}
