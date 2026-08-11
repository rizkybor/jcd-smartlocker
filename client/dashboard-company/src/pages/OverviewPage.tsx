import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatCard, Panel, DataTable, Field, StatusBadge, type DataTableColumn } from '@smartbox/ui';
import {
  companyApi,
  type OverviewRingkasan,
  type OverviewTrenPoin,
  type OverviewMitraRow,
  type OverviewLokerRow,
  type LokerStatus,
  ApiError,
} from '../api/client';
import { TrendChart } from '../components/TrendChart';

function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal);
}

const LOKER_STATUS_TONE: Record<LokerStatus, 'tersedia' | 'terisi' | 'nonaktif'> = {
  TERSEDIA: 'tersedia',
  TERISI: 'terisi',
  MAINTENANCE: 'nonaktif',
  OFFLINE: 'nonaktif',
  NONAKTIF: 'nonaktif',
};

export function OverviewPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<OverviewRingkasan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tren, setTren] = useState<OverviewTrenPoin[] | null>(null);
  const [mitraRows, setMitraRows] = useState<OverviewMitraRow[] | null>(null);

  const [lokerPage, setLokerPage] = useState(1);
  const [lokerStatus, setLokerStatus] = useState<LokerStatus | ''>('');
  const [lokerSearch, setLokerSearch] = useState('');
  const [lokerResult, setLokerResult] = useState<Awaited<ReturnType<typeof companyApi.overviewLokers>> | null>(null);
  const [lokerError, setLokerError] = useState<string | null>(null);

  useEffect(() => {
    companyApi
      .overview()
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('overviewPage.gagalMuat')));
    companyApi.overviewTren().then((res) => setTren(res.data)).catch(() => {});
    companyApi.overviewMitra().then((res) => setMitraRows(res.data)).catch(() => {});
  }, [t]);

  useEffect(() => {
    companyApi
      .overviewLokers(lokerPage, 25, lokerStatus || undefined, lokerSearch || undefined)
      .then(setLokerResult)
      .catch((err) => setLokerError(err instanceof ApiError ? err.message : t('overviewPage.gagalMuatLoker')));
  }, [lokerPage, lokerStatus, lokerSearch, t]);

  const mitraTop = mitraRows ? [...mitraRows].sort((a, b) => b.okupansiPersen - a.okupansiPersen).slice(0, 8) : [];

  const mitraColumns: DataTableColumn<OverviewMitraRow>[] = [
    { header: t('overviewPage.kolomMitra'), render: (m) => m.mitraNama },
    { header: t('overviewPage.kolomJumlahUnit'), align: 'center', render: (m) => m.jumlahUnit },
    { header: t('overviewPage.kolomOkupansi'), align: 'right', render: (m) => `${m.okupansiPersen}%` },
    { header: t('overviewPage.kolomPendapatanBulanIni'), align: 'right', render: (m) => formatRupiah(m.pendapatanBulanIni) },
  ];

  const lokerColumns: DataTableColumn<OverviewLokerRow>[] = [
    { header: t('overviewPage.kolomLoker'), render: (l) => l.nomorLoker },
    { header: t('overviewPage.kolomUnit'), render: (l) => l.kodeUnit },
    { header: t('overviewPage.kolomLokasi'), render: (l) => l.lokasiNama },
    {
      header: t('overviewPage.kolomStatus'),
      render: (l) => <StatusBadge status={LOKER_STATUS_TONE[l.status]}>{l.status}</StatusBadge>,
    },
    {
      header: t('overviewPage.kolomAktivitasTerakhir'),
      render: (l) => (l.lastActivityAt ? new Date(l.lastActivityAt).toLocaleString('id-ID') : '—'),
    },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        {t('overviewPage.judul')}
      </h1>

      {error ? (
        <Panel>
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        </Panel>
      ) : !data ? (
        <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-6)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sl-space-5)' }}>
            <StatCard label={t('overviewPage.lokasi')} value={data.jumlahLokasi} accent="primary" />
            <StatCard
              label={t('overviewPage.unit')}
              value={data.jumlahUnit}
              caption={t('overviewPage.unitCaption', { online: data.unitOnline, offline: data.unitOffline })}
              accent="primary"
            />
            <StatCard
              label={t('overviewPage.okupansiLoker')}
              value={data.okupansiPersen}
              unit="%"
              caption={t('overviewPage.okupansiCaption', { terisi: data.lokerPerStatus.terisi, total: data.jumlahLoker })}
              accent="occupied"
            />
            <StatCard label={t('overviewPage.pendapatan')} value={formatRupiah(data.pendapatanTotal)} accent="available" />
          </div>

          <Panel title={t('overviewPage.tren14Hari')}>
            {tren ? <TrendChart data={tren} /> : <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>}
          </Panel>

          <Panel title={t('overviewPage.okupansiPerMitra')}>
            {!mitraRows ? (
              <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
            ) : mitraTop.length === 0 ? (
              <div style={{ color: 'var(--sl-text-muted)' }}>{t('overviewPage.belumAdaMitra')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-3)' }}>
                {mitraTop.map((m) => (
                  <div key={m.mitraId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sl-space-3)' }}>
                    <span style={{ width: 160, fontSize: 'var(--sl-fs-13)', color: 'var(--sl-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.mitraNama}
                    </span>
                    <div style={{ flex: 1, height: 8, background: 'var(--sl-n-100)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${m.okupansiPersen}%`, height: '100%', background: 'var(--sl-status-occupied)', borderRadius: 999 }} />
                    </div>
                    <span style={{ width: 48, textAlign: 'right', fontSize: 'var(--sl-fs-13)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-text-strong)' }}>
                      {m.okupansiPersen}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title={t('overviewPage.semuaMitra')}>
            {!mitraRows ? (
              <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
            ) : (
              <DataTable columns={mitraColumns} rows={mitraRows} striped />
            )}
          </Panel>

          <Panel title={t('overviewPage.semuaLoker')}>
            <div style={{ display: 'flex', gap: 'var(--sl-space-4)', marginBottom: 'var(--sl-space-4)', maxWidth: 480 }}>
              <Field
                label={t('overviewPage.filterStatus')}
                options={[
                  { value: '', label: t('overviewPage.semuaStatus') },
                  { value: 'TERSEDIA', label: 'TERSEDIA' },
                  { value: 'TERISI', label: 'TERISI' },
                  { value: 'MAINTENANCE', label: 'MAINTENANCE' },
                  { value: 'OFFLINE', label: 'OFFLINE' },
                  { value: 'NONAKTIF', label: 'NONAKTIF' },
                ]}
                value={lokerStatus}
                onChange={(e) => {
                  setLokerStatus(e.target.value as LokerStatus | '');
                  setLokerPage(1);
                }}
              />
              <Field
                label={t('overviewPage.cari')}
                value={lokerSearch}
                onChange={(e) => {
                  setLokerSearch(e.target.value);
                  setLokerPage(1);
                }}
                placeholder={t('overviewPage.cariPlaceholder')}
              />
            </div>
            {lokerError ? (
              <div style={{ color: 'var(--sl-status-offline-strong)' }}>{lokerError}</div>
            ) : !lokerResult ? (
              <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
            ) : (
              <DataTable
                columns={lokerColumns}
                rows={lokerResult.data}
                striped
                pagination={{ meta: lokerResult.meta, onPageChange: setLokerPage, itemLabel: t('overviewPage.itemLabelLoker') }}
              />
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
