import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatCard, Panel } from '@smartbox/ui';
import { companyApi, type OverviewRingkasan, ApiError } from '../api/client';

function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal);
}

export function OverviewPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<OverviewRingkasan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    companyApi
      .overview()
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('overviewPage.gagalMuat')));
  }, [t]);

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
      )}
    </div>
  );
}
