import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, StatusBadge, Field, nomorUrut, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type LogAktivitasRow, type LogKategori } from '../api/client';
import { formatTanggalLokasi } from '../utils/formatTanggal';

export function AktivitasPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [kategori, setKategori] = useState<LogKategori | ''>('');
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.aktivitas.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    companyApi.aktivitas
      .list(page, 25, kategori || undefined)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('aktivitasPage.gagalMuat')));
  }, [page, kategori, t]);

  const columns: DataTableColumn<LogAktivitasRow>[] = [
    { header: t('common.no'), width: 1, render: (_r, i) => nomorUrut(i, result?.meta) },
    // Log aktivitas tidak terikat 1 Lokasi (aksi lintas sistem, mis.
    // provisioning user) — pakai Asia/Jakarta sebagai referensi HQ secara
    // EKSPLISIT + berlabel (bukan diam-diam ikut timezone browser staff
    // yang bisa salah baca kalau staff sedang di luar kota, §7.2).
    { header: t('aktivitasPage.kolomWaktu'), render: (r) => formatTanggalLokasi(r.createdAt, 'Asia/Jakarta') },
    { header: t('aktivitasPage.kolomAktor'), render: (r) => `${r.aktor.nama} (${r.aktorRole})` },
    { header: t('aktivitasPage.kolomKategori'), render: (r) => <StatusBadge status={r.kategori === 'KEAMANAN' ? 'offline' : 'tersedia'}>{r.kategori}</StatusBadge> },
    { header: t('aktivitasPage.kolomAksi'), render: (r) => r.aksi },
    { header: t('aktivitasPage.kolomEntitas'), render: (r) => `${r.entitas}${r.entitasId ? ` (${r.entitasId.slice(0, 8)}…)` : ''}` },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        {t('aktivitasPage.judul')}
      </h1>

      <div style={{ marginBottom: 'var(--sl-space-5)', maxWidth: 220 }}>
        <Field
          label={t('aktivitasPage.kategori')}
          options={[
            { value: '', label: t('aktivitasPage.semuaKategori') },
            { value: 'KEAMANAN', label: t('aktivitasPage.keamanan') },
            { value: 'OPERASIONAL', label: t('aktivitasPage.operasional') },
          ]}
          value={kategori}
          onChange={(e) => {
            setKategori(e.target.value as LogKategori | '');
            setPage(1);
          }}
        />
      </div>

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
        ) : result.data.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('aktivitasPage.kosong')}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('aktivitasPage.itemLabel') }}
          />
        )}
      </Panel>
    </div>
  );
}
