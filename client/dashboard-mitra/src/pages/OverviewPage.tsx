import { useEffect, useState } from 'react';
import { StatCard, Panel } from '@smartbox/ui';
import { mitraApi, type OverviewRingkasan, ApiError } from '../api/client';

function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal);
}

export function OverviewPage() {
  const [data, setData] = useState<OverviewRingkasan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mitraApi
      .overview()
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat ringkasan.'));
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        Overview
      </h1>

      {error ? (
        <Panel>
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        </Panel>
      ) : !data ? (
        <div style={{ color: 'var(--sl-text-muted)' }}>Memuat...</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sl-space-5)' }}>
          <StatCard label="Lokasi" value={data.jumlahLokasi} accent="primary" />
          <StatCard label="Unit" value={data.jumlahUnit} caption={`${data.unitOnline} online, ${data.unitOffline} offline`} accent="primary" />
          <StatCard label="Okupansi Loker" value={data.okupansiPersen} unit="%" caption={`${data.lokerPerStatus.terisi}/${data.jumlahLoker} terisi`} accent="occupied" />
          <StatCard label="Pendapatan" value={formatRupiah(data.pendapatanTotal)} accent="available" />
        </div>
      )}
    </div>
  );
}
