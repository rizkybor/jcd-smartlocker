import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, Button, StatusBadge, ConfirmDialog, useToast, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type MemberRow } from '../api/client';
import { CreateMemberDialog } from './members/CreateMemberDialog';

/**
 * Fitur member RFID/kode unik (di luar cakupan PRD awal — permintaan
 * bisnis langsung, lihat catatan model `Member` di schema.prisma). Cuma
 * Super Admin — mitra kelola member "umum" miliknya sendiri lewat
 * Dashboard Mitra (dashboard-mitra.controller.ts, lihat komentar di sana).
 */
export function MembersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.members.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  function reload() {
    companyApi.members
      .list(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('membersPage.gagalMuat')));
  }

  useEffect(reload, [page, t]);

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await companyApi.members.remove(removeTarget.id);
      toast({ title: t('membersPage.toastDinonaktifkan'), description: removeTarget.nama, tone: 'success' });
      setRemoveTarget(null);
      reload();
    } catch (err) {
      setRemoveError(err instanceof ApiError ? err.message : t('membersPage.gagalNonaktifkan'));
    } finally {
      setRemoveLoading(false);
    }
  }

  const columns: DataTableColumn<MemberRow>[] = [
    { header: t('membersPage.kolomKode'), render: (m) => m.kode },
    { header: t('membersPage.kolomNama'), render: (m) => m.nama },
    { header: t('membersPage.kolomMitra'), render: (m) => m.mitra.nama },
    {
      header: t('membersPage.kolomJenis'),
      render: (m) =>
        m.lokerId ? (
          <StatusBadge status="terisi">{t('membersPage.jenisEksklusif')}</StatusBadge>
        ) : (
          <StatusBadge status="tersedia">{t('membersPage.jenisUmum')}</StatusBadge>
        ),
    },
    {
      header: t('membersPage.kolomDetail'),
      render: (m) =>
        m.loker
          ? t('membersPage.lokerDetail', { unit: m.loker.unit.kodeUnit, nomor: m.loker.nomorLoker })
          : t('membersPage.diskonDetail', { persen: m.diskonPersen ?? 0 }),
    },
    {
      header: t('membersPage.kolomStatus'),
      render: (m) => <StatusBadge status={m.aktif ? 'tersedia' : 'nonaktif'}>{m.aktif ? t('common.aktif') : t('common.nonaktif')}</StatusBadge>,
    },
    {
      header: '',
      align: 'right',
      render: (m) =>
        m.aktif ? (
          <Button tone="danger" size="sm" onClick={() => setRemoveTarget(m)}>
            {t('common.nonaktifkan')}
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sl-space-6)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          {t('membersPage.judul')}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>{t('membersPage.tambahMember')}</Button>
      </div>

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('membersPage.itemLabel') }}
          />
        )}
      </Panel>

      <CreateMemberDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          reload();
        }}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
            setRemoveError(null);
          }
        }}
        title={t('membersPage.nonaktifkanTitle', { nama: removeTarget?.nama })}
        description={t('membersPage.nonaktifkanDeskripsi')}
        tone="danger"
        confirmLabel={t('common.nonaktifkan')}
        loading={removeLoading}
        errorMessage={removeError}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
