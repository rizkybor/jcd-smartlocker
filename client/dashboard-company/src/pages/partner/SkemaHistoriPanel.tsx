import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, Button, Field, StatusBadge, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type MitraLokasiFull, type SkemaHistoriRow } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { formatTanggalLokasi } from '../../utils/formatTanggal';

/**
 * Alur ajukan/approve persentase revenue sharing (§10, §12 poin 2) — Super
 * Admin MENENTUKAN persentase baru, Manager APPROVE/REJECT. Dua role
 * berbeda, ditegakkan sungguhan di backend guard; di sini cuma
 * menyembunyikan tombol yang bukan hak role yang sedang login (§5.6).
 */
export function SkemaHistoriPanel({ mitraLokasi }: { mitraLokasi: MitraLokasiFull }) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [rows, setRows] = useState<SkemaHistoriRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [persentaseBaru, setPersentaseBaru] = useState('');
  const [ajukanLoading, setAjukanLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  function reload() {
    companyApi.skemaHistori
      .list(mitraLokasi.id)
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('skemaHistoriPanel.gagalMuat')));
  }

  useEffect(reload, [mitraLokasi.id, t]);

  async function handleAjukan() {
    setAjukanLoading(true);
    setError(null);
    try {
      await companyApi.skemaHistori.ajukan(mitraLokasi.id, Number(persentaseBaru));
      setPersentaseBaru('');
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('skemaHistoriPanel.gagalAjukan'));
    } finally {
      setAjukanLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoadingId(id);
    setError(null);
    try {
      await companyApi.skemaHistori.approve(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('skemaHistoriPanel.gagalApprove'));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoadingId(id);
    setError(null);
    try {
      await companyApi.skemaHistori.reject(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('skemaHistoriPanel.gagalReject'));
    } finally {
      setActionLoadingId(null);
    }
  }

  const adaPending = rows?.some((r) => r.statusApproval === 'PENDING') ?? false;

  const columns: DataTableColumn<SkemaHistoriRow>[] = [
    { header: t('skemaHistoriPanel.kolomPersentase'), align: 'right', numeric: true, render: (r) => `${r.persentase}%` },
    {
      header: t('skemaHistoriPanel.kolomStatus'),
      render: (r) => (
        <StatusBadge status={r.statusApproval === 'APPROVED' ? 'tersedia' : r.statusApproval === 'PENDING' ? 'terisi' : 'offline'}>
          {r.statusApproval}
        </StatusBadge>
      ),
    },
    { header: t('skemaHistoriPanel.kolomDiajukan'), render: (r) => formatTanggalLokasi(r.diajukanAt, mitraLokasi.lokasi.timezone) },
    {
      header: t('skemaHistoriPanel.kolomBerlakuSampai'),
      render: (r) => (r.berlakuSampai ? formatTanggalLokasi(r.berlakuSampai, mitraLokasi.lokasi.timezone, 'dd MMM yyyy') : '—'),
    },
    {
      header: '',
      align: 'right',
      render: (r) =>
        r.statusApproval === 'PENDING' && profile?.role === 'MANAGER' ? (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <Button tone="primary" size="sm" disabled={actionLoadingId === r.id} onClick={() => handleApprove(r.id)}>
              {t('skemaHistoriPanel.approve')}
            </Button>
            <Button tone="danger" size="sm" disabled={actionLoadingId === r.id} onClick={() => handleReject(r.id)}>
              {t('skemaHistoriPanel.reject')}
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <Panel
      title={t('skemaHistoriPanel.panelTitle', { lokasi: mitraLokasi.lokasi.nama })}
      description={t('skemaHistoriPanel.panelDescription', { persen: mitraLokasi.persentaseAktif ?? 0 })}
    >
      {profile?.role === 'SUPER_ADMIN' ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 'var(--sl-space-5)', maxWidth: 320 }}>
          <Field
            label={t('skemaHistoriPanel.tentukanPersentase')}
            type="number"
            value={persentaseBaru}
            onChange={(e) => setPersentaseBaru(e.target.value)}
            placeholder={t('skemaHistoriPanel.placeholderPersentase')}
          />
          <Button
            disabled={ajukanLoading || !persentaseBaru || adaPending}
            onClick={handleAjukan}
          >
            {ajukanLoading ? t('skemaHistoriPanel.mengirim') : t('skemaHistoriPanel.tentukan')}
          </Button>
        </div>
      ) : null}
      {adaPending && profile?.role === 'SUPER_ADMIN' ? (
        <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-text-muted)', marginBottom: 'var(--sl-space-4)' }}>
          {t('skemaHistoriPanel.pendingWarning')}
        </div>
      ) : null}
      {error ? <div style={{ color: 'var(--sl-status-offline-strong)', marginBottom: 'var(--sl-space-4)' }}>{error}</div> : null}
      {!rows ? (
        <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
      ) : rows.length === 0 ? (
        <div style={{ color: 'var(--sl-text-muted)' }}>{t('skemaHistoriPanel.kosong')}</div>
      ) : (
        <DataTable columns={columns} rows={rows} striped />
      )}
    </Panel>
  );
}
