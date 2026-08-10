import { useEffect, useState } from 'react';
import { Panel, DataTable, Button, Field, StatusBadge, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type MitraLokasiFull, type SkemaHistoriRow } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

/**
 * Alur ajukan/approve persentase revenue sharing (§10, §12 poin 2) — Super
 * Admin MENENTUKAN persentase baru, Manager APPROVE/REJECT. Dua role
 * berbeda, ditegakkan sungguhan di backend guard; di sini cuma
 * menyembunyikan tombol yang bukan hak role yang sedang login (§5.6).
 */
export function SkemaHistoriPanel({ mitraLokasi }: { mitraLokasi: MitraLokasiFull }) {
  const { profile } = useAuth();
  const [rows, setRows] = useState<SkemaHistoriRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [persentaseBaru, setPersentaseBaru] = useState('');
  const [ajukanLoading, setAjukanLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  function reload() {
    companyApi.skemaHistori
      .list(mitraLokasi.id)
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat riwayat skema.'));
  }

  useEffect(reload, [mitraLokasi.id]);

  async function handleAjukan() {
    setAjukanLoading(true);
    setError(null);
    try {
      await companyApi.skemaHistori.ajukan(mitraLokasi.id, Number(persentaseBaru));
      setPersentaseBaru('');
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menentukan persentase.');
    } finally {
      setAjukanLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoadingId(id);
    setError(null);
    try {
      await companyApi.skemaHistori.approve(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal approve.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoadingId(id);
    setError(null);
    try {
      await companyApi.skemaHistori.reject(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal reject.');
    } finally {
      setActionLoadingId(null);
    }
  }

  const adaPending = rows?.some((r) => r.statusApproval === 'PENDING') ?? false;

  const columns: DataTableColumn<SkemaHistoriRow>[] = [
    { header: 'Persentase', align: 'right', numeric: true, render: (r) => `${r.persentase}%` },
    {
      header: 'Status',
      render: (r) => (
        <StatusBadge status={r.statusApproval === 'APPROVED' ? 'tersedia' : r.statusApproval === 'PENDING' ? 'terisi' : 'offline'}>
          {r.statusApproval}
        </StatusBadge>
      ),
    },
    { header: 'Diajukan', render: (r) => new Date(r.diajukanAt).toLocaleString('id-ID') },
    { header: 'Berlaku Sampai', render: (r) => (r.berlakuSampai ? new Date(r.berlakuSampai).toLocaleDateString('id-ID') : '—') },
    {
      header: '',
      align: 'right',
      render: (r) =>
        r.statusApproval === 'PENDING' && profile?.role === 'MANAGER' ? (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <Button tone="primary" size="sm" disabled={actionLoadingId === r.id} onClick={() => handleApprove(r.id)}>
              Approve
            </Button>
            <Button tone="danger" size="sm" disabled={actionLoadingId === r.id} onClick={() => handleReject(r.id)}>
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <Panel title={`Skema Bagi Hasil — ${mitraLokasi.lokasi.nama}`} description={`Persentase aktif saat ini: ${mitraLokasi.persentaseAktif ?? 0}%`}>
      {profile?.role === 'SUPER_ADMIN' ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 'var(--sl-space-5)', maxWidth: 320 }}>
          <Field label="Tentukan Persentase Baru" type="number" value={persentaseBaru} onChange={(e) => setPersentaseBaru(e.target.value)} placeholder="0-100" />
          <Button
            disabled={ajukanLoading || !persentaseBaru || adaPending}
            onClick={handleAjukan}
          >
            {ajukanLoading ? 'Mengirim...' : 'Tentukan'}
          </Button>
        </div>
      ) : null}
      {adaPending && profile?.role === 'SUPER_ADMIN' ? (
        <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-text-muted)', marginBottom: 'var(--sl-space-4)' }}>
          Masih ada pengajuan menunggu approval Manager — tunggu diproses dulu sebelum menentukan yang baru.
        </div>
      ) : null}
      {error ? <div style={{ color: 'var(--sl-status-offline-strong)', marginBottom: 'var(--sl-space-4)' }}>{error}</div> : null}
      {!rows ? (
        <div style={{ color: 'var(--sl-text-muted)' }}>Memuat...</div>
      ) : rows.length === 0 ? (
        <div style={{ color: 'var(--sl-text-muted)' }}>Belum ada riwayat persentase.</div>
      ) : (
        <DataTable columns={columns} rows={rows} striped />
      )}
    </Panel>
  );
}
