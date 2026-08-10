import { useEffect, useState } from 'react';
import { Panel, DataTable, Button, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type EmergencyUnlockLogRow } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { CatatEmergencyUnlockDialog } from './emergency-unlock/CatatEmergencyUnlockDialog';

export function EmergencyUnlockPage() {
  const { profile } = useAuth();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.emergencyUnlockLog.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // STAFF boleh POST (catat kejadian) tapi backend GET list-nya
  // SUPER_ADMIN/OPS only (§5.5) — jangan panggil list untuk STAFF, bakal
  // 403. Tampilkan cuma tombol catat untuk STAFF.
  const bolehLihatRiwayat = profile?.role === 'SUPER_ADMIN' || profile?.role === 'OPS';
  const bolehCatat = profile?.role === 'STAFF' || profile?.role === 'SUPER_ADMIN';

  function reload() {
    if (!bolehLihatRiwayat) return;
    companyApi.emergencyUnlockLog
      .list(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat log emergency unlock.'));
  }

  useEffect(reload, [page, bolehLihatRiwayat]);

  const columns: DataTableColumn<EmergencyUnlockLogRow>[] = [
    { header: 'Waktu Kejadian', render: (r) => r.waktuKejadianLokal },
    { header: 'Lokasi', render: (r) => r.lokasiNama },
    { header: 'Unit', render: (r) => r.kodeUnit },
    { header: 'Loker', render: (r) => r.nomorLoker },
    { header: 'Dicatat Oleh', render: (r) => r.staff.nama },
    { header: 'Catatan', wrap: true, render: (r) => r.catatan || <span style={{ color: 'var(--sl-text-faint)' }}>—</span> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sl-space-2)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          Emergency Unlock
        </h1>
        {bolehCatat ? <Button onClick={() => setCreateOpen(true)}>+ Catat Kejadian</Button> : null}
      </div>
      <p style={{ color: 'var(--sl-text-muted)', marginTop: 0, marginBottom: 'var(--sl-space-6)' }}>
        Riwayat pemakaian kunci fisik oleh Staff di lapangan — dicatat manual setelah kejadian (§5.3).
      </p>

      <Panel>
        {!bolehLihatRiwayat ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>
            Role Anda ({profile?.role}) bisa mencatat kejadian, tapi tidak bisa melihat riwayat lengkap — itu khusus Super Admin/Ops.
          </div>
        ) : error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Memuat...</div>
        ) : result.data.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Belum ada catatan.</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            footer={
              <>
                <span>
                  Halaman {result.meta.page} dari {result.meta.totalPages} — {result.meta.totalItems} catatan
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

      <CatatEmergencyUnlockDialog
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
