import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, Field } from '@smartbox/ui';
import { companyApi, ApiError, type Lokasi, type TipeSkema } from '../../api/client';

const DIALOG_STYLE = {
  content: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '92vw',
    maxWidth: 460,
    background: '#fff',
    borderRadius: 'var(--sl-radius-lg)',
    boxShadow: 'var(--sl-elev-5)',
    padding: 'var(--sl-space-6)',
    fontFamily: 'var(--sl-font-body)',
  },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(11,27,69,.45)' },
};

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
  const [lokasiId, setLokasiId] = useState('');
  const [tipeSkema, setTipeSkema] = useState<TipeSkema>('FIXED_RENTAL');
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

  const valid = nama.trim().length > 0 && lokasiId.length > 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await companyApi.mitra.create({ nama: nama.trim(), kontak: kontak.trim() || undefined, lokasiId, tipeSkema });
      setNama('');
      setKontak('');
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
              label={t('createMitraDialog.lokasi')}
              required
              options={lokasiList.map((l) => ({ value: l.id, label: l.nama }))}
              value={lokasiId}
              onChange={(e) => setLokasiId(e.target.value)}
            />
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
