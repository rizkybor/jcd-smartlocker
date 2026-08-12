import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Panel, Button, Field, StatusBadge, ConfirmDialog, DataTable, nomorUrut, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type MitraFull, type OverviewMitraDetail, type OverviewMitraUnitRow } from '../api/client';
import { SkemaHistoriPanel } from './partner/SkemaHistoriPanel';

function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal);
}

export function MitraDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mitra, setMitra] = useState<MitraFull | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [bolehKelolaMember, setBolehKelolaMember] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [hapusOpen, setHapusOpen] = useState(false);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const [penghasilan, setPenghasilan] = useState<OverviewMitraDetail | null>(null);
  const [penghasilanError, setPenghasilanError] = useState<string | null>(null);

  function reload() {
    if (!id) return;
    companyApi.mitra
      .detail(id)
      .then((res) => {
        setMitra(res.data);
        setNama(res.data.nama);
        setKontak(res.data.kontak ?? '');
        setBolehKelolaMember(res.data.bolehKelolaMember);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : t('mitraDetailPage.gagalMuat')));
    companyApi
      .overviewMitraDetail(id)
      .then((res) => setPenghasilan(res.data))
      .catch((err) => setPenghasilanError(err instanceof ApiError ? err.message : t('mitraDetailPage.gagalMuatPenghasilan')));
  }

  useEffect(reload, [id, t]);

  const unitColumns: DataTableColumn<OverviewMitraUnitRow>[] = [
    { header: t('common.no'), width: 1, render: (_u, i) => nomorUrut(i) },
    { header: t('mitraDetailPage.kolomUnit'), render: (u) => u.kodeUnit },
    { header: t('mitraDetailPage.kolomLokasi'), render: (u) => u.lokasiNama },
    { header: t('mitraDetailPage.kolomOkupansi'), align: 'right', render: (u) => `${u.okupansiPersen}%` },
    { header: t('mitraDetailPage.kolomPendapatanBulanIni'), align: 'right', render: (u) => formatRupiah(u.pendapatanBulanIni) },
    { header: t('mitraDetailPage.kolomPendapatanTotal'), align: 'right', render: (u) => formatRupiah(u.pendapatanTotal) },
  ];

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await companyApi.mitra.update(id, { nama: nama.trim(), kontak: kontak.trim() || undefined, bolehKelolaMember });
      setSaved(true);
      reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : t('mitraDetailPage.gagalSimpan'));
    } finally {
      setSaving(false);
    }
  }

  async function handleHapusConfirm() {
    if (!id) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await companyApi.mitra.remove(id);
      navigate('/partner');
    } catch (err) {
      setHapusError(err instanceof ApiError ? err.message : t('mitraDetailPage.gagalHapus'));
    } finally {
      setHapusLoading(false);
    }
  }

  if (loadError) {
    return (
      <Panel>
        <div style={{ color: 'var(--sl-status-offline-strong)' }}>{loadError}</div>
      </Panel>
    );
  }
  if (!mitra) return <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        {mitra.nama}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-6)' }}>
        <Panel title={t('mitraDetailPage.dataDasar')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)', maxWidth: 420 }}>
            <Field label={t('mitraDetailPage.namaMitra')} required value={nama} onChange={(e) => setNama(e.target.value)} />
            <Field label={t('mitraDetailPage.kontak')} value={kontak} onChange={(e) => setKontak(e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sl-space-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={bolehKelolaMember}
                onChange={(e) => setBolehKelolaMember(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                <span style={{ display: 'block', fontSize: 'var(--sl-fs-14)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-text-strong)' }}>
                  {t('mitraDetailPage.bolehKelolaMember')}
                </span>
                <span style={{ display: 'block', fontSize: 'var(--sl-fs-12)', color: 'var(--sl-text-muted)' }}>
                  {t('mitraDetailPage.bolehKelolaMemberHint')}
                </span>
              </span>
            </label>
            {saveError ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-offline-strong)' }}>{saveError}</div> : null}
            {saved ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-available-strong)' }}>{t('common.tersimpan')}</div> : null}
            <div>
              <Button onClick={handleSave} disabled={saving || !nama.trim()}>
                {saving ? t('common.menyimpan') : t('common.simpan')}
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title={t('mitraDetailPage.lokasiSkema')}>
          {mitra.mitraLokasi.length === 0 ? (
            <div style={{ color: 'var(--sl-text-muted)' }}>{t('mitraDetailPage.kosongLokasi')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
              {mitra.mitraLokasi.map((ml) => (
                <div key={ml.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sl-space-3)' }}>
                  <span style={{ fontWeight: 'var(--sl-fw-semibold)' }}>{ml.lokasi.nama}</span>
                  <StatusBadge status={ml.tipeSkema === 'REVENUE_SHARING' ? 'terisi' : 'tersedia'}>
                    {ml.tipeSkema === 'REVENUE_SHARING' ? t('common.tipeSkema.revenueSharing') : t('common.tipeSkema.fixedRental')}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {mitra.mitraLokasi
          .filter((ml) => ml.tipeSkema === 'REVENUE_SHARING')
          .map((ml) => (
            <SkemaHistoriPanel key={ml.id} mitraLokasi={ml} />
          ))}

        <Panel title={t('mitraDetailPage.penghasilan')}>
          {penghasilanError ? (
            <div style={{ color: 'var(--sl-status-offline-strong)' }}>{penghasilanError}</div>
          ) : !penghasilan ? (
            <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--sl-space-6)' }}>
                <div>
                  <div style={{ fontSize: 'var(--sl-fs-12)', color: 'var(--sl-text-muted)' }}>{t('mitraDetailPage.pendapatanTotal')}</div>
                  <div style={{ fontSize: 'var(--sl-fs-20)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
                    {formatRupiah(penghasilan.pendapatanTotal)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--sl-fs-12)', color: 'var(--sl-text-muted)' }}>{t('mitraDetailPage.pendapatanBulanIni')}</div>
                  <div style={{ fontSize: 'var(--sl-fs-20)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)' }}>
                    {formatRupiah(penghasilan.pendapatanBulanIni)}
                  </div>
                </div>
              </div>
              {penghasilan.units.length === 0 ? (
                <div style={{ color: 'var(--sl-text-muted)' }}>{t('mitraDetailPage.belumAdaUnit')}</div>
              ) : (
                <DataTable columns={unitColumns} rows={penghasilan.units} striped />
              )}
            </div>
          )}
        </Panel>

        <Panel style={{ borderColor: 'var(--sl-status-offline)' }}>
          <h2 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-16)', fontWeight: 'var(--sl-fw-bold)', marginTop: 0, color: 'var(--sl-status-offline-strong)' }}>
            {t('mitraDetailPage.zonaBerbahaya')}
          </h2>
          <p style={{ color: 'var(--sl-text-muted)', marginTop: 0 }}>{t('mitraDetailPage.zonaBerbahayaDeskripsi')}</p>
          <Button tone="danger" onClick={() => setHapusOpen(true)}>
            {t('mitraDetailPage.hapusMitra')}
          </Button>
        </Panel>
      </div>

      <ConfirmDialog
        open={hapusOpen}
        onOpenChange={(open) => {
          setHapusOpen(open);
          if (!open) setHapusError(null);
        }}
        title={t('mitraDetailPage.hapusTitle', { nama: mitra.nama })}
        description={t('mitraDetailPage.hapusDeskripsi')}
        tone="danger"
        confirmLabel={t('common.hapus')}
        loading={hapusLoading}
        errorMessage={hapusError}
        onConfirm={handleHapusConfirm}
      />
    </div>
  );
}
