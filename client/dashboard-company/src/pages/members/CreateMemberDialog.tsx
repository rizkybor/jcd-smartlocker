import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, Field } from '@smartbox/ui';
import { companyApi, ApiError, type Mitra, type Unit, type Loker } from '../../api/client';

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

type Jenis = 'EKSKLUSIF' | 'UMUM';

/**
 * Fitur member RFID/kode unik (di luar cakupan PRD awal) — cuma Super
 * Admin bisa bikin member EKSKLUSIF (ikat 1 loker spesifik, gratis),
 * karena itu menyangkut kapasitas publik loker milik mitra (§ konfirmasi
 * bisnis). Loker dipilih 2 tahap: Unit dulu (difilter ke mitra terpilih),
 * baru daftar loker milik unit itu — `companyApi.units.list()` sudah
 * menyertakan `lokers` langsung, tidak perlu panggilan detail terpisah.
 */
export function CreateMemberDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [mitraList, setMitraList] = useState<Mitra[]>([]);
  const [unitList, setUnitList] = useState<Unit[]>([]);

  const [mitraId, setMitraId] = useState('');
  const [jenis, setJenis] = useState<Jenis>('UMUM');
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [unitId, setUnitId] = useState('');
  const [lokerId, setLokerId] = useState('');
  const [diskonPersen, setDiskonPersen] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    companyApi.mitra.list(1, 100).then((res) => setMitraList(res.data));
    companyApi.units.list(1, 100).then((res) => setUnitList(res.data));
  }, [open]);

  function reset() {
    setMitraId('');
    setJenis('UMUM');
    setKode('');
    setNama('');
    setKontak('');
    setUnitId('');
    setLokerId('');
    setDiskonPersen('10');
    setError(null);
  }

  const unitOptionsUntukMitra = unitList.filter((u) => u.lokasi.mitraLokasi.some((ml) => ml.mitraId === mitraId));
  const lokerOptionsUntukUnit: Loker[] = unitOptionsUntukMitra.find((u) => u.id === unitId)?.lokers ?? [];

  const valid =
    mitraId.length > 0 &&
    kode.trim().length > 0 &&
    nama.trim().length > 0 &&
    (jenis === 'EKSKLUSIF' ? lokerId.length > 0 : Number(diskonPersen) >= 0 && Number(diskonPersen) <= 100);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await companyApi.members.create({
        mitraId,
        kode: kode.trim(),
        nama: nama.trim(),
        kontak: kontak.trim() || undefined,
        ...(jenis === 'EKSKLUSIF' ? { lokerId } : { diskonPersen: Number(diskonPersen) }),
      });
      reset();
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('membersPage.gagalSimpan'));
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
            {t('membersPage.tambahMember')}
          </Dialog.Title>

          <div style={{ marginTop: 'var(--sl-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
            <Field
              label={t('membersPage.mitra')}
              required
              options={[{ value: '', label: t('membersPage.pilihMitra') }, ...mitraList.map((m) => ({ value: m.id, label: m.nama }))]}
              value={mitraId}
              onChange={(e) => {
                setMitraId(e.target.value);
                setUnitId('');
                setLokerId('');
              }}
            />
            <Field label={t('membersPage.kode')} required value={kode} onChange={(e) => setKode(e.target.value)} hint={t('membersPage.kodeHint')} />
            <Field label={t('membersPage.nama')} required value={nama} onChange={(e) => setNama(e.target.value)} />
            <Field label={t('membersPage.kontak')} value={kontak} onChange={(e) => setKontak(e.target.value)} />

            <Field
              label={t('membersPage.jenis')}
              required
              options={[
                { value: 'UMUM', label: t('membersPage.jenisUmum') },
                { value: 'EKSKLUSIF', label: t('membersPage.jenisEksklusif') },
              ]}
              value={jenis}
              onChange={(e) => setJenis(e.target.value as Jenis)}
            />

            {jenis === 'UMUM' ? (
              <Field
                label={t('membersPage.diskonPersen')}
                required
                type="number"
                value={diskonPersen}
                onChange={(e) => setDiskonPersen(e.target.value)}
                hint={t('membersPage.diskonHint')}
              />
            ) : (
              <>
                <Field
                  label={t('membersPage.unit')}
                  required
                  disabled={!mitraId}
                  options={[
                    { value: '', label: t('membersPage.pilihUnit') },
                    ...unitOptionsUntukMitra.map((u) => ({ value: u.id, label: u.kodeUnit })),
                  ]}
                  value={unitId}
                  onChange={(e) => {
                    setUnitId(e.target.value);
                    setLokerId('');
                  }}
                />
                <Field
                  label={t('membersPage.loker')}
                  required
                  disabled={!unitId}
                  options={[
                    { value: '', label: t('membersPage.pilihLoker') },
                    ...lokerOptionsUntukUnit.map((l) => ({ value: l.id, label: `${l.nomorLoker} (${l.status})` })),
                  ]}
                  value={lokerId}
                  onChange={(e) => setLokerId(e.target.value)}
                  hint={t('membersPage.eksklusifHint')}
                />
              </>
            )}

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
