import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, DataTable, Button, StatusBadge, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type Unit } from '../api/client';
import { CreateUnitDialog } from './units/CreateUnitDialog';

export function UnitsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.units.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  function reload() {
    companyApi.units
      .list(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat daftar unit.'));
  }

  useEffect(reload, [page]);

  const columns: DataTableColumn<Unit>[] = [
    { header: 'Kode Unit', render: (u) => u.kodeUnit },
    { header: 'Lokasi', render: (u) => u.lokasi.nama },
    {
      header: 'Mitra',
      render: (u) => u.lokasi.mitraLokasi.map((ml) => ml.mitra.nama).join(', ') || <span style={{ color: 'var(--sl-text-faint)' }}>—</span>,
    },
    { header: 'Loker', align: 'center', render: (u) => `${u.lokers.filter((l) => l.status === 'TERSEDIA').length}/${u.jumlahLoker}` },
    { header: 'Mode', render: (u) => (u.modePemakaian === 'BERBAYAR' ? 'Berbayar' : 'Gratis') },
    { header: 'Status', render: (u) => <StatusBadge status={u.aktif ? 'tersedia' : 'nonaktif'}>{u.aktif ? 'Aktif' : 'Nonaktif'}</StatusBadge> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sl-space-6)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          Unit Locker
        </h1>
        <Button onClick={() => setCreateOpen(true)}>+ Tambah Unit</Button>
      </div>

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Memuat...</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            onRowClick={(u) => navigate(`/units/${u.id}`)}
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: 'unit' }}
          />
        )}
      </Panel>

      <CreateUnitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          reload();
        }}
      />
    </div>
  );
}
