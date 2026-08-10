import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, Field } from '@smartbox/ui';
import { companyApi, ApiError, type Unit } from '../../api/client';

const DIALOG_STYLE = {
  content: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '92vw',
    maxWidth: 440,
    background: '#fff',
    borderRadius: 'var(--sl-radius-lg)',
    boxShadow: 'var(--sl-elev-5)',
    padding: 'var(--sl-space-6)',
    fontFamily: 'var(--sl-font-body)',
  },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(11,27,69,.45)' },
};

function nowLocalIso() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function CatatEmergencyUnlockDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lokerId, setLokerId] = useState('');
  const [waktuKejadian, setWaktuKejadian] = useState(nowLocalIso());
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    companyApi.units
      .list(1, 100)
      .then((res) => setUnits(res.data))
      .catch(() => setError(t('catatEmergencyUnlockDialog.gagalMuatUnit')));
  }, [open, t]);

  const lokerOptions = units.flatMap((u) =>
    u.lokers.map((l) => ({
      value: l.id,
      label: t('catatEmergencyUnlockDialog.lokerOptionLabel', { lokasi: u.lokasi.nama, kodeUnit: u.kodeUnit, nomor: l.nomorLoker }),
    })),
  );

  const valid = lokerId.length > 0 && waktuKejadian.length > 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await companyApi.emergencyUnlockLog.create({
        lokerId,
        catatan: catatan.trim() || undefined,
        waktuKejadian: new Date(waktuKejadian).toISOString(),
      });
      setLokerId('');
      setCatatan('');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('catatEmergencyUnlockDialog.gagalSimpan'));
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
            {t('catatEmergencyUnlockDialog.judul')}
          </Dialog.Title>
          <Dialog.Description style={{ marginTop: 4, fontSize: 'var(--sl-fs-13)', color: 'var(--sl-text-muted)' }}>
            {t('catatEmergencyUnlockDialog.deskripsi')}
          </Dialog.Description>

          <div style={{ marginTop: 'var(--sl-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
            <Field
              label={t('catatEmergencyUnlockDialog.loker')}
              required
              options={[{ value: '', label: t('catatEmergencyUnlockDialog.pilihLoker') }, ...lokerOptions]}
              value={lokerId}
              onChange={(e) => setLokerId(e.target.value)}
            />
            <Field label={t('catatEmergencyUnlockDialog.waktuKejadian')} required type="datetime-local" value={waktuKejadian} onChange={(e) => setWaktuKejadian(e.target.value)} />
            <Field label={t('catatEmergencyUnlockDialog.catatan')} multiline value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder={t('common.opsional')} />
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
