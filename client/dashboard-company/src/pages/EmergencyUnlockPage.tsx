import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, Button, useToast, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type EmergencyUnlockLogRow } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { CatatEmergencyUnlockDialog } from './emergency-unlock/CatatEmergencyUnlockDialog';

export function EmergencyUnlockPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { toast } = useToast();
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
      .catch((err) => setError(err instanceof ApiError ? err.message : t('emergencyUnlockPage.gagalMuat')));
  }

  useEffect(reload, [page, bolehLihatRiwayat, t]);

  const columns: DataTableColumn<EmergencyUnlockLogRow>[] = [
    { header: t('emergencyUnlockPage.kolomWaktuKejadian'), render: (r) => r.waktuKejadianLokal },
    { header: t('emergencyUnlockPage.kolomLokasi'), render: (r) => r.lokasiNama },
    { header: t('emergencyUnlockPage.kolomUnit'), render: (r) => r.kodeUnit },
    { header: t('emergencyUnlockPage.kolomLoker'), render: (r) => r.nomorLoker },
    { header: t('emergencyUnlockPage.kolomDicatatOleh'), render: (r) => r.staff.nama },
    { header: t('emergencyUnlockPage.kolomCatatan'), wrap: true, render: (r) => r.catatan || <span style={{ color: 'var(--sl-text-faint)' }}>—</span> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sl-space-2)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          {t('emergencyUnlockPage.judul')}
        </h1>
        {bolehCatat ? <Button onClick={() => setCreateOpen(true)}>{t('emergencyUnlockPage.catatKejadian')}</Button> : null}
      </div>
      <p style={{ color: 'var(--sl-text-muted)', marginTop: 0, marginBottom: 'var(--sl-space-6)' }}>
        {t('emergencyUnlockPage.deskripsi')}
      </p>

      <Panel>
        {!bolehLihatRiwayat ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>
            {t('emergencyUnlockPage.tanpaAkses', { role: profile?.role })}
          </div>
        ) : error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
        ) : result.data.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('emergencyUnlockPage.kosong')}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('emergencyUnlockPage.itemLabel') }}
          />
        )}
      </Panel>

      <CatatEmergencyUnlockDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          toast({ title: t('emergencyUnlockPage.toastDicatat'), tone: 'success' });
          reload();
        }}
      />
    </div>
  );
}
