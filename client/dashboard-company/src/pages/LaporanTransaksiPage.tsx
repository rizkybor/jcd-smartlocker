import { useEffect, useState } from 'react';
import { Panel, DataTable, StatusBadge, useToast, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type LaporanFilter, type LaporanTransaksiRow } from '../api/client';
import { LaporanFilterBar } from './laporan/LaporanFilterBar';

function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal);
}

const STATUS_MAP: Record<LaporanTransaksiRow['statusBayar'], 'tersedia' | 'terisi' | 'offline'> = {
  PAID: 'tersedia',
  PENDING: 'terisi',
  FAILED: 'offline',
  EXPIRED: 'offline',
};

export function LaporanTransaksiPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<LaporanFilter>({});
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.laporan.transaksi>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  useEffect(() => {
    companyApi.laporan
      .transaksi(filter, page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat laporan transaksi.'));
  }, [filter, page]);

  async function handleExport() {
    setExporting(true);
    setExportUrl(null);
    setError(null);
    try {
      const res = await companyApi.laporan.export('transaksi', filter);
      setExportUrl(res.data.url);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal ekspor laporan.';
      setError(message);
      toast({ title: 'Ekspor gagal', description: message, tone: 'error' });
    } finally {
      setExporting(false);
    }
  }

  const columns: DataTableColumn<LaporanTransaksiRow>[] = [
    { header: 'ID Transaksi', render: (r) => r.idTransaksi },
    { header: 'Tanggal', render: (r) => r.tanggal },
    { header: 'Lokasi', render: (r) => r.lokasiNama },
    { header: 'Mitra', render: (r) => r.mitraNama },
    { header: 'Loker', render: (r) => r.nomorLoker },
    { header: 'Nominal', align: 'right', numeric: true, render: (r) => formatRupiah(r.nominal) },
    { header: 'Status', render: (r) => <StatusBadge status={STATUS_MAP[r.statusBayar]}>{r.statusBayar}</StatusBadge> },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        Laporan Transaksi
      </h1>

      <LaporanFilterBar
        filter={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        onExport={handleExport}
        exporting={exporting}
      />

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
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Memuat...</div>
        ) : result.data.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Tidak ada transaksi untuk filter ini.</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: 'transaksi' }}
          />
        )}
      </Panel>
    </div>
  );
}
