import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, Button, StatusBadge, useToast, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type MitraFull } from '../api/client';
import { CreateMitraDialog } from './partner/CreateMitraDialog';

export function PartnerPage() {
  const { t } = useTranslation();
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
      .catch((err) => setError(err instanceof ApiError ? err.message : t('partnerPage.gagalMuat')));
  }

  useEffect(reload, [page, t]);

  const columns: DataTableColumn<MitraFull>[] = [
    { header: t('partnerPage.kolomNamaMitra'), render: (m) => m.nama },
    { header: t('partnerPage.kolomKontak'), render: (m) => m.kontak || <span style={{ color: 'var(--sl-text-faint)' }}>—</span> },
    { header: t('partnerPage.kolomLokasi'), render: (m) => m.mitraLokasi.map((ml) => ml.lokasi.nama).join(', ') || '—' },
    {
      header: t('partnerPage.kolomSkema'),
      render: (m) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {m.mitraLokasi.map((ml) => (
            <StatusBadge key={ml.id} status={ml.tipeSkema === 'REVENUE_SHARING' ? 'terisi' : 'tersedia'}>
              {ml.tipeSkema === 'REVENUE_SHARING'
                ? t('partnerPage.bagiHasilPersen', { persen: ml.persentaseAktif ?? 0 })
                : t('common.tipeSkema.fixedRental')}
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
          {t('partnerPage.judul')}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>{t('partnerPage.tambahMitra')}</Button>
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
            onRowClick={(m) => navigate(`/partner/${m.id}`)}
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('partnerPage.itemLabel') }}
          />
        )}
      </Panel>

      <CreateMitraDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          toast({ title: t('partnerPage.toastDitambahkan'), tone: 'success' });
          reload();
        }}
      />
    </div>
  );
}
