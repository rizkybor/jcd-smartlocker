import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, Button, Field, StatusBadge, ConfirmDialog, useToast, nomorUrut, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type MemberRow, type Mitra } from '../api/client';
import { CreateMemberDialog } from './members/CreateMemberDialog';

/**
 * Fitur member RFID/kode unik (di luar cakupan PRD awal — permintaan
 * bisnis langsung, lihat catatan model `Member` di schema.prisma). Cuma
 * Super Admin — mitra kelola member "umum" miliknya sendiri lewat
 * Dashboard Mitra (dashboard-mitra.controller.ts, lihat komentar di sana).
 *
 * Super Admin BISA kelola member lintas semua mitra, TAPI wajib
 * MENENTUKAN DULU mitra mana yang mau dikelola (dropdown di bawah) —
 * bukan daftar tercampur semua mitra sekaligus. Ini mencerminkan model
 * data sebenarnya (member selalu milik 1 mitra tertentu) dan mencegah
 * salah pilih mitra saat membuat member baru (dulu dropdown mitra ada di
 * DALAM dialog "Tambah Member" — dipindah ke sini supaya konteks mitra
 * sudah pasti SEBELUM form dibuka, bukan salah satu dari banyak field).
 */
export function MembersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [mitraList, setMitraList] = useState<Mitra[]>([]);
  const [mitraId, setMitraId] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.members.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    companyApi.mitra.list(1, 100).then((res) => setMitraList(res.data));
  }, []);

  function reload() {
    if (!mitraId) {
      setResult(null);
      return;
    }
    companyApi.members
      .list(page, 25, mitraId)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('membersPage.gagalMuat')));
  }

  useEffect(reload, [page, mitraId, t]);

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await companyApi.members.remove(removeTarget.id);
      toast({ title: t('membersPage.toastDinonaktifkan'), description: removeTarget.nama, tone: 'success' });
      setRemoveTarget(null);
      reload();
    } catch (err) {
      setRemoveError(err instanceof ApiError ? err.message : t('membersPage.gagalNonaktifkan'));
    } finally {
      setRemoveLoading(false);
    }
  }

  const columns: DataTableColumn<MemberRow>[] = [
    { header: t('common.no'), width: 1, render: (_m, i) => nomorUrut(i, result?.meta) },
    { header: t('membersPage.kolomKode'), render: (m) => m.kode },
    { header: t('membersPage.kolomNama'), render: (m) => m.nama },
    {
      header: t('membersPage.kolomJenis'),
      render: (m) =>
        m.lokerId ? (
          <StatusBadge status="terisi">{t('membersPage.jenisEksklusif')}</StatusBadge>
        ) : (
          <StatusBadge status="tersedia">{t('membersPage.jenisUmum')}</StatusBadge>
        ),
    },
    {
      header: t('membersPage.kolomDetail'),
      render: (m) =>
        m.loker
          ? t('membersPage.lokerDetail', { unit: m.loker.unit.kodeUnit, nomor: m.loker.nomorLoker })
          : t('membersPage.diskonDetail', { persen: m.diskonPersen ?? 0 }),
    },
    {
      header: t('membersPage.kolomStatus'),
      render: (m) => <StatusBadge status={m.aktif ? 'tersedia' : 'nonaktif'}>{m.aktif ? t('common.aktif') : t('common.nonaktif')}</StatusBadge>,
    },
    {
      header: '',
      align: 'right',
      render: (m) =>
        m.aktif ? (
          <Button tone="danger" size="sm" onClick={() => setRemoveTarget(m)}>
            {t('common.nonaktifkan')}
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sl-space-6)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          {t('membersPage.judul')}
        </h1>
        <Button onClick={() => setCreateOpen(true)} disabled={!mitraId}>
          {t('membersPage.tambahMember')}
        </Button>
      </div>

      <div style={{ maxWidth: 360, marginBottom: 'var(--sl-space-5)' }}>
        <Field
          label={t('membersPage.mitra')}
          required
          options={[{ value: '', label: t('membersPage.pilihMitra') }, ...mitraList.map((m) => ({ value: m.id, label: m.nama }))]}
          value={mitraId}
          onChange={(e) => {
            setMitraId(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Panel>
        {!mitraId ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('membersPage.pilihMitraDulu')}</div>
        ) : error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('membersPage.itemLabel') }}
          />
        )}
      </Panel>

      {mitraId ? (
        <CreateMemberDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          mitraId={mitraId}
          onCreated={() => {
            setCreateOpen(false);
            reload();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
            setRemoveError(null);
          }
        }}
        title={t('membersPage.nonaktifkanTitle', { nama: removeTarget?.nama })}
        description={t('membersPage.nonaktifkanDeskripsi')}
        tone="danger"
        confirmLabel={t('common.nonaktifkan')}
        loading={removeLoading}
        errorMessage={removeError}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
