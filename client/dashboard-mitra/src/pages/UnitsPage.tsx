import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, StatusBadge, type DataTableColumn } from '@smartbox/ui';
import { mitraApi, ApiError, type Unit } from '../api/client';

export function UnitsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof mitraApi.units>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mitraApi
      .units(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('unitsPage.gagalMuat')));
  }, [page, t]);

  const columns: DataTableColumn<Unit>[] = [
    { header: t('unitsPage.kodeUnit'), render: (u) => u.kodeUnit },
    { header: t('unitsPage.lokasi'), render: (u) => u.lokasi.nama },
    {
      header: t('unitsPage.loker'),
      align: 'center',
      render: (u) => t('unitsPage.lokerTersedia', { jumlah: u.lokers.filter((l) => l.status === 'TERSEDIA').length, total: u.jumlahLoker }),
    },
    { header: t('unitsPage.mode'), render: (u) => (u.modePemakaian === 'BERBAYAR' ? t('unitsPage.berbayar') : t('unitsPage.gratis')) },
    {
      header: t('unitsPage.status'),
      render: (u) => <StatusBadge status={u.aktif ? 'tersedia' : 'nonaktif'}>{u.aktif ? t('unitsPage.aktif') : t('unitsPage.nonaktif')}</StatusBadge>,
    },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        {t('unitsPage.judul')}
      </h1>

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
        ) : result.data.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('unitsPage.belumAdaUnit')}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('unitsPage.itemLabel') }}
          />
        )}
      </Panel>
    </div>
  );
}
