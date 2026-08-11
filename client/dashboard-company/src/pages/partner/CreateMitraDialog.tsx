import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, Field } from '@smartbox/ui';
import { companyApi, ApiError, type Lokasi, type TipeSkema } from '../../api/client';
import { WilayahPicker, type WilayahValue } from '../../components/WilayahPicker';

const DIALOG_STYLE = {
  content: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '92vw',
    maxWidth: 480,
    background: '#fff',
    borderRadius: 'var(--sl-radius-lg)',
    boxShadow: 'var(--sl-elev-5)',
    padding: 'var(--sl-space-6)',
    fontFamily: 'var(--sl-font-body)',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
  },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(11,27,69,.45)' },
};

type ModeLokasi = 'EXISTING' | 'BARU';

export function CreateMitraDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [tipeSkema, setTipeSkema] = useState<TipeSkema>('FIXED_RENTAL');

  const [modeLokasi, setModeLokasi] = useState<ModeLokasi>('EXISTING');
  const [lokasiId, setLokasiId] = useState('');
  const [lokasiBaruNama, setLokasiBaruNama] = useState('');
  const [lokasiBaruAlamat, setLokasiBaruAlamat] = useState('');
  const [lokasiBaruTimezone, setLokasiBaruTimezone] = useState('Asia/Jakarta');
  const [wilayah, setWilayah] = useState<WilayahValue | null>(null);

  const [akunNama, setAkunNama] = useState('');
  const [akunEmail, setAkunEmail] = useState('');
  const [akunPassword, setAkunPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    companyApi
      .lokasiList()
      .then((res) => {
        setLokasiList(res.data);
        setLokasiId((prev) => prev || res.data[0]?.id || '');
      })
      .catch(() => setError(t('createMitraDialog.gagalMuatLokasi')));
  }, [open, t]);

  function reset() {
    setNama('');
    setKontak('');
    setTipeSkema('FIXED_RENTAL');
    setModeLokasi('EXISTING');
    setLokasiBaruNama('');
    setLokasiBaruAlamat('');
    setLokasiBaruTimezone('Asia/Jakarta');
    setWilayah(null);
    setAkunNama('');
    setAkunEmail('');
    setAkunPassword('');
    setError(null);
  }

  const lokasiValid = modeLokasi === 'EXISTING' ? lokasiId.length > 0 : lokasiBaruNama.trim().length > 0 && lokasiBaruAlamat.trim().length > 0 && !!wilayah;

  const valid =
    nama.trim().length > 0 &&
    lokasiValid &&
    akunNama.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(akunEmail) &&
    akunPassword.length >= 8;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await companyApi.mitra.create({
        nama: nama.trim(),
        kontak: kontak.trim() || undefined,
        tipeSkema,
        akunMitra: { nama: akunNama.trim(), email: akunEmail.trim(), password: akunPassword },
        ...(modeLokasi === 'EXISTING'
          ? { lokasiId }
          : { lokasiBaru: { nama: lokasiBaruNama.trim(), alamat: lokasiBaruAlamat.trim(), timezone: lokasiBaruTimezone, wilayah: wilayah! } }),
      });
      reset();
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('createMitraDialog.gagalSimpan'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={DIALOG_STYLE.overlay} />
        <Dialog.Content style={DIALOG_STYLE.content}>
          <Dialog.Title style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-20)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
            {t('createMitraDialog.judul')}
          </Dialog.Title>

          <div style={{ marginTop: 'var(--sl-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
            <Field label={t('createMitraDialog.namaMitra')} required value={nama} onChange={(e) => setNama(e.target.value)} />
            <Field label={t('createMitraDialog.kontak')} value={kontak} onChange={(e) => setKontak(e.target.value)} placeholder={t('common.opsional')} />
            <Field
              label={t('createMitraDialog.tipeSkema')}
              required
              options={[
                { value: 'FIXED_RENTAL', label: t('createMitraDialog.fixedRentalOption') },
                { value: 'REVENUE_SHARING', label: t('createMitraDialog.revenueSharingOption') },
              ]}
              value={tipeSkema}
              onChange={(e) => setTipeSkema(e.target.value as TipeSkema)}
              hint={tipeSkema === 'REVENUE_SHARING' ? t('createMitraDialog.hintRevenueSharing') : undefined}
            />

            <div style={{ borderTop: 'var(--sl-border-w) solid var(--sl-border-subtle)', paddingTop: 'var(--sl-space-4)' }}>
              <Field
                label={t('createMitraDialog.lokasi')}
                required
                options={[
                  { value: 'EXISTING', label: t('createMitraDialog.lokasiExisting') },
                  { value: 'BARU', label: t('createMitraDialog.lokasiBaru') },
                ]}
                value={modeLokasi}
                onChange={(e) => setModeLokasi(e.target.value as ModeLokasi)}
              />
              {modeLokasi === 'EXISTING' ? (
                <div style={{ marginTop: 'var(--sl-space-4)' }}>
                  <Field
                    label={t('createMitraDialog.pilihLokasi')}
                    required
                    options={lokasiList.map((l) => ({ value: l.id, label: l.nama }))}
                    value={lokasiId}
                    onChange={(e) => setLokasiId(e.target.value)}
                  />
                </div>
              ) : (
                <div style={{ marginTop: 'var(--sl-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
                  <Field label={t('createMitraDialog.namaLokasi')} required value={lokasiBaruNama} onChange={(e) => setLokasiBaruNama(e.target.value)} />
                  <Field label={t('createMitraDialog.alamat')} required multiline value={lokasiBaruAlamat} onChange={(e) => setLokasiBaruAlamat(e.target.value)} />
                  <Field label={t('createMitraDialog.timezone')} required value={lokasiBaruTimezone} onChange={(e) => setLokasiBaruTimezone(e.target.value)} hint="Asia/Jakarta, Asia/Makassar, Asia/Jayapura" />
                  <WilayahPicker onChange={setWilayah} />
                </div>
              )}
            </div>

            <div style={{ borderTop: 'var(--sl-border-w) solid var(--sl-border-subtle)', paddingTop: 'var(--sl-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
              <span style={{ fontSize: 'var(--sl-fs-13)', fontWeight: 'var(--sl-fw-semibold)', color: 'var(--sl-text-strong)' }}>
                {t('createMitraDialog.akunLogin')}
              </span>
              <Field label={t('createMitraDialog.namaPic')} required value={akunNama} onChange={(e) => setAkunNama(e.target.value)} />
              <Field label={t('createMitraDialog.email')} required type="email" value={akunEmail} onChange={(e) => setAkunEmail(e.target.value)} />
              <Field label={t('createMitraDialog.password')} required type="password" value={akunPassword} onChange={(e) => setAkunPassword(e.target.value)} hint={t('createMitraDialog.passwordHint')} />
            </div>

            {error ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-offline-strong)' }}>{error}</div> : null}
          </div>

          <div style={{ marginTop: 'var(--sl-space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--sl-space-3)' }}>
            <Dialog.Close asChild>
              <Button tone="outline" disabled={submitting}>
                {t('common.batal')}
              </Button>
            </Dialog.Close>
            <Button onClick={handleSubmit} disabled={!valid || submitting}>
              {submitting ? t('common.menyimpan') : t('common.simpan')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
