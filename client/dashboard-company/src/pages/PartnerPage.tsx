import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, DataTable, Button, StatusBadge, useToast, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type MitraFull } from '../api/client';
import { CreateMitraDialog } from './partner/CreateMitraDialog';

export function PartnerPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.mitra.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  function reload() {
    companyApi.mitra
      .list(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat daftar mitra.'));
  }

  useEffect(reload, [page]);

  const columns: DataTableColumn<MitraFull>[] = [
    { header: 'Nama Mitra', render: (m) => m.nama },
    { header: 'Kontak', render: (m) => m.kontak || <span style={{ color: 'var(--sl-text-faint)' }}>—</span> },
    { header: 'Lokasi', render: (m) => m.mitraLokasi.map((ml) => ml.lokasi.nama).join(', ') || '—' },
    {
      header: 'Skema',
      render: (m) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {m.mitraLokasi.map((ml) => (
            <StatusBadge key={ml.id} status={ml.tipeSkema === 'REVENUE_SHARING' ? 'terisi' : 'tersedia'}>
              {ml.tipeSkema === 'REVENUE_SHARING' ? `Bagi Hasil ${ml.persentaseAktif ?? 0}%` : 'Fixed Rental'}
            </StatusBadge>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sl-space-6)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          Mitra & Skema
        </h1>
        <Button onClick={() => setCreateOpen(true)}>+ Tambah Mitra</Button>
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
            onRowClick={(m) => navigate(`/partner/${m.id}`)}
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: 'mitra' }}
          />
        )}
      </Panel>

      <CreateMitraDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          toast({ title: 'Mitra ditambahkan', tone: 'success' });
          reload();
        }}
      />
    </div>
  );
}
