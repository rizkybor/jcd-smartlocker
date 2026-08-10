import { useEffect, useState } from 'react';
import { Panel, DataTable, useToast, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type LaporanFilter, type LaporanBagiHasilRow } from '../api/client';
import { LaporanFilterBar } from './laporan/LaporanFilterBar';

function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal);
}

export function LaporanBagiHasilPage() {
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
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat laporan bagi hasil.'));
  }, [filter]);

  async function handleExport() {
    setExporting(true);
    setExportUrl(null);
    setError(null);
    try {
      const res = await companyApi.laporan.export('bagi-hasil', filter);
      setExportUrl(res.data.url);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal ekspor laporan.';
      setError(message);
      toast({ title: 'Ekspor gagal', description: message, tone: 'error' });
    } finally {
      setExporting(false);
    }
  }

  const columns: DataTableColumn<LaporanBagiHasilRow>[] = [
    { header: 'Mitra', render: (r) => r.mitraNama },
    { header: 'Lokasi', render: (r) => r.lokasiNama },
    { header: 'Persentase', align: 'right', render: (r) => (r.persentaseAktif !== null ? `${r.persentaseAktif}%` : '—') },
    { header: 'Jumlah Transaksi', align: 'right', numeric: true, render: (r) => r.jumlahTransaksi },
    { header: 'Total Nominal', align: 'right', numeric: true, render: (r) => formatRupiah(r.totalNominal) },
    { header: 'Bagi Hasil Mitra', align: 'right', numeric: true, render: (r) => formatRupiah(r.totalBagiHasilMitra) },
    { header: 'Bagi Hasil Smartbox', align: 'right', numeric: true, render: (r) => formatRupiah(r.totalBagiHasilSmartbox) },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        Laporan Bagi Hasil
      </h1>
      <p style={{ color: 'var(--sl-text-muted)', marginTop: -16, marginBottom: 'var(--sl-space-6)' }}>
        Cuma mitra tipe Revenue Sharing — pakai persentase yang berlaku saat transaksi terjadi, bukan persentase sekarang.
      </p>

      <LaporanFilterBar filter={filter} onChange={setFilter} onExport={handleExport} exporting={exporting} />

      {exportUrl ? (
        <Panel style={{ marginBottom: 'var(--sl-space-5)' }}>
          File siap —{' '}
          <a href={exportUrl} target="_blank" rel="noreferrer">
            unduh CSV
          </a>{' '}
          (tautan berlaku 1 jam).
        </Panel>
      ) : null}

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !rows ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Memuat...</div>
        ) : rows.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Tidak ada mitra Revenue Sharing untuk filter ini.</div>
        ) : (
          <DataTable columns={columns} rows={rows} striped />
        )}
      </Panel>
    </div>
  );
}
