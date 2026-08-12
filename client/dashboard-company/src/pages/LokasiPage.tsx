import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, Button, StatusBadge, ConfirmDialog, useToast, nomorUrut, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type LokasiDenganPemakaian } from '../api/client';

/**
 * Manajemen Lokasi (di luar cakupan PRD awal — permintaan bisnis
 * langsung). Lokasi sebelumnya cuma bisa dipilih/dibuat inline di dalam
 * dialog Create Mitra/Create Unit, tidak pernah punya halaman sendiri —
 * halaman ini kasih Super Admin visibilitas penuh + kemampuan hapus
 * Lokasi yang sudah tidak dipakai siapa pun.
 *
 * Hapus HANYA boleh kalau `jumlahUnit` dan `jumlahMitraLokasi` keduanya 0
 * (dicek ulang di backend, lokasi.service.ts::remove() — tombol
 * disabled di sini murni UX, bukan satu-satunya penegakan).
 */
export function LokasiPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.lokasi.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<LokasiDenganPemakaian | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  function reload() {
    companyApi.lokasi
      .list(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('lokasiPage.gagalMuat')));
  }

  useEffect(reload, [page, t]);

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await companyApi.lokasi.remove(removeTarget.id);
      toast({ title: t('lokasiPage.toastDihapus'), description: removeTarget.nama, tone: 'success' });
      setRemoveTarget(null);
      reload();
    } catch (err) {
      setRemoveError(err instanceof ApiError ? err.message : t('lokasiPage.gagalHapus'));
    } finally {
      setRemoveLoading(false);
    }
  }

  const columns: DataTableColumn<LokasiDenganPemakaian>[] = [
    { header: t('common.no'), width: 1, render: (_l, i) => nomorUrut(i, result?.meta) },
    { header: t('lokasiPage.kolomNama'), render: (l) => l.nama },
    { header: t('lokasiPage.kolomAlamat'), render: (l) => l.alamat },
    { header: t('lokasiPage.kolomWilayah'), render: (l) => `${l.kecamatanNama}, ${l.kabupatenNama}, ${l.provinsiNama}` },
    {
      header: t('lokasiPage.kolomPemakaian'),
      align: 'center',
      render: (l) =>
        l._count.units === 0 && l._count.mitraLokasi === 0 ? (
          <StatusBadge status="tersedia">{t('lokasiPage.tidakDipakai')}</StatusBadge>
        ) : (
          <StatusBadge status="terisi">{t('lokasiPage.dipakai', { unit: l._count.units, mitra: l._count.mitraLokasi })}</StatusBadge>
        ),
    },
    {
      header: '',
      align: 'right',
      render: (l) => {
        const bolehHapus = l._count.units === 0 && l._count.mitraLokasi === 0;
        return (
          <Button tone="danger" size="sm" disabled={!bolehHapus} onClick={() => setRemoveTarget(l)}>
            {t('common.hapus')}
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        {t('lokasiPage.judul')}
      </h1>

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
        ) : result.data.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('lokasiPage.belumAdaLokasi')}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('lokasiPage.itemLabel') }}
          />
        )}
      </Panel>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
            setRemoveError(null);
          }
        }}
        title={t('lokasiPage.hapusTitle', { nama: removeTarget?.nama })}
        description={t('lokasiPage.hapusDeskripsi')}
        tone="danger"
        confirmLabel={t('common.hapus')}
        loading={removeLoading}
        errorMessage={removeError}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
