import { useEffect, useState } from 'react';
import { Panel, DataTable, StatusBadge, type DataTableColumn } from '@smartbox/ui';
import { mitraApi, ApiError, type Unit } from '../api/client';

export function UnitsPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof mitraApi.units>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mitraApi
      .units(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat daftar unit.'));
  }, [page]);

  const columns: DataTableColumn<Unit>[] = [
    { header: 'Kode Unit', render: (u) => u.kodeUnit },
    { header: 'Lokasi', render: (u) => u.lokasi.nama },
    { header: 'Loker', align: 'center', render: (u) => `${u.lokers.filter((l) => l.status === 'TERSEDIA').length}/${u.jumlahLoker} tersedia` },
    { header: 'Mode', render: (u) => (u.modePemakaian === 'BERBAYAR' ? 'Berbayar' : 'Gratis') },
    { header: 'Status', render: (u) => <StatusBadge status={u.aktif ? 'tersedia' : 'nonaktif'}>{u.aktif ? 'Aktif' : 'Nonaktif'}</StatusBadge> },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        Unit Locker
      </h1>

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Memuat...</div>
        ) : result.data.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Belum ada unit di lokasi Anda.</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: 'unit' }}
          />
        )}
      </Panel>
    </div>
  );
}
