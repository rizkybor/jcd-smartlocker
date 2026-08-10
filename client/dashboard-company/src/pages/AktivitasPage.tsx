import { useEffect, useState } from 'react';
import { Panel, DataTable, Button, StatusBadge, Field, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type LogAktivitasRow, type LogKategori } from '../api/client';

export function AktivitasPage() {
  const [page, setPage] = useState(1);
  const [kategori, setKategori] = useState<LogKategori | ''>('');
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.aktivitas.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    companyApi.aktivitas
      .list(page, 25, kategori || undefined)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat log aktivitas.'));
  }, [page, kategori]);

  const columns: DataTableColumn<LogAktivitasRow>[] = [
    { header: 'Waktu', render: (r) => new Date(r.createdAt).toLocaleString('id-ID') },
    { header: 'Aktor', render: (r) => `${r.aktor.nama} (${r.aktorRole})` },
    { header: 'Kategori', render: (r) => <StatusBadge status={r.kategori === 'KEAMANAN' ? 'offline' : 'tersedia'}>{r.kategori}</StatusBadge> },
    { header: 'Aksi', render: (r) => r.aksi },
    { header: 'Entitas', render: (r) => `${r.entitas}${r.entitasId ? ` (${r.entitasId.slice(0, 8)}…)` : ''}` },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        Aktivitas
      </h1>

      <div style={{ marginBottom: 'var(--sl-space-5)', maxWidth: 220 }}>
        <Field
          label="Kategori"
          options={[
            { value: '', label: 'Semua Kategori' },
            { value: 'KEAMANAN', label: 'Keamanan' },
            { value: 'OPERASIONAL', label: 'Operasional' },
          ]}
          value={kategori}
          onChange={(e) => {
            setKategori(e.target.value as LogKategori | '');
            setPage(1);
          }}
        />
      </div>

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Memuat...</div>
        ) : result.data.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Belum ada aktivitas.</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            footer={
              <>
                <span>
                  Halaman {result.meta.page} dari {result.meta.totalPages} — {result.meta.totalItems} entri
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button tone="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Sebelumnya
                  </Button>
                  <Button tone="outline" size="sm" disabled={page >= result.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                    Berikutnya
                  </Button>
                </div>
              </>
            }
          />
        )}
      </Panel>
    </div>
  );
}
