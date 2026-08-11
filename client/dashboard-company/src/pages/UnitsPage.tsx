import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, Button, StatusBadge, nomorUrut, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type Unit } from '../api/client';
import { CreateUnitDialog } from './units/CreateUnitDialog';

export function UnitsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.units.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  function reload() {
    companyApi.units
      .list(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('unitsPage.gagalMuat')));
  }

  useEffect(reload, [page, t]);

  const columns: DataTableColumn<Unit>[] = [
    { header: t('common.no'), width: 1, render: (_u, i) => nomorUrut(i, result?.meta) },
    { header: t('unitsPage.kolomKodeUnit'), render: (u) => u.kodeUnit },
    { header: t('unitsPage.kolomLokasi'), render: (u) => u.lokasi.nama },
    {
      header: t('unitsPage.kolomMitra'),
      render: (u) => u.lokasi.mitraLokasi.map((ml) => ml.mitra.nama).join(', ') || <span style={{ color: 'var(--sl-text-faint)' }}>—</span>,
    },
    { header: t('unitsPage.kolomLoker'), align: 'center', render: (u) => `${u.lokers.filter((l) => l.status === 'TERSEDIA').length}/${u.jumlahLoker}` },
    { header: t('unitsPage.kolomMode'), render: (u) => (u.modePemakaian === 'BERBAYAR' ? t('common.modePemakaian.berbayar') : t('common.modePemakaian.gratis')) },
    {
      header: t('unitsPage.kolomStatus'),
      render: (u) => <StatusBadge status={u.aktif ? 'tersedia' : 'nonaktif'}>{u.aktif ? t('common.aktif') : t('common.nonaktif')}</StatusBadge>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sl-space-6)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          {t('unitsPage.judul')}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>{t('unitsPage.tambahUnit')}</Button>
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
            onRowClick={(u) => navigate(`/units/${u.id}`)}
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('unitsPage.itemLabel') }}
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
