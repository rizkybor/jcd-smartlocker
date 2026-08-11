import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Panel, Button, Field, StatusBadge } from '@smartbox/ui';
import { companyApi, ApiError, type MitraFull } from '../api/client';
import { SkemaHistoriPanel } from './partner/SkemaHistoriPanel';

export function MitraDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [mitra, setMitra] = useState<MitraFull | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [bolehKelolaMember, setBolehKelolaMember] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
  }

  useEffect(reload, [id, t]);

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
      </div>
    </div>
  );
}
