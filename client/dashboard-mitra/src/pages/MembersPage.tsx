import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, Button, StatusBadge, ConfirmDialog, Field, useToast, nomorUrut, type DataTableColumn } from '@smartbox/ui';
import { mitraApi, ApiError, type MemberRow } from '../api/client';
import { useAuth } from '../auth/AuthContext';

/**
 * Fitur member RFID/kode unik (di luar cakupan PRD awal — permintaan
 * bisnis langsung). Mitra HANYA kelola member "umum" (diskon tarif) untuk
 * lokasi miliknya sendiri — TIDAK PERNAH bisa mengikat loker spesifik ke
 * member (itu keputusan Super Admin, lihat dashboard-mitra.controller.ts).
 * Satu-satunya endpoint tulis yang dipunyai Dashboard Mitra (§ revisi
 * kebijakan SMB-704 — lihat komentar di controller backend).
 *
 * Akses ke SELURUH halaman ini dikunci `profile.bolehKelolaMember` — normalnya
 * menu sidebar sudah disembunyikan (DashboardLayout.tsx), tapi guard di sini
 * juga jaga-jaga kalau mitra buka URL `/members` langsung tanpa lewat menu.
 * Backend tetap jadi penegak utama (member.service.ts::assertBolehKelolaMember).
 */
export function MembersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof mitraApi.members.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [diskonPersen, setDiskonPersen] = useState('10');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  function reload() {
    if (profile && !profile.bolehKelolaMember) return;
    mitraApi.members
      .list(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('membersPage.gagalMuat')));
  }

  useEffect(reload, [page, t, profile]);

  function resetCreateForm() {
    setKode('');
    setNama('');
    setKontak('');
    setDiskonPersen('10');
    setCreateError(null);
  }

  async function handleCreateConfirm() {
    const diskon = Number(diskonPersen);
    if (kode.trim().length === 0 || nama.trim().length === 0 || !(diskon >= 0 && diskon <= 100)) {
      setCreateError(t('membersPage.validasiForm'));
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await mitraApi.members.create({ kode: kode.trim(), nama: nama.trim(), kontak: kontak.trim() || undefined, diskonPersen: diskon });
      toast({ title: t('membersPage.toastDibuat'), description: nama, tone: 'success' });
      resetCreateForm();
      setCreateOpen(false);
      reload();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : t('membersPage.gagalSimpan'));
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await mitraApi.members.remove(removeTarget.id);
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
    { header: t('membersPage.kolomDiskon'), render: (m) => t('membersPage.diskonDetail', { persen: m.diskonPersen ?? 0 }) },
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

  if (profile && !profile.bolehKelolaMember) {
    return (
      <Panel>
        <div style={{ color: 'var(--sl-text-muted)' }}>{t('membersPage.belumDiberiAkses')}</div>
      </Panel>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sl-space-6)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          {t('membersPage.judul')}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>{t('membersPage.tambahMember')}</Button>
      </div>

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
        ) : result.data.length === 0 ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('membersPage.belumAdaMember')}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('membersPage.itemLabel') }}
          />
        )}
      </Panel>

      <ConfirmDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
        title={t('membersPage.tambahMember')}
        description={t('membersPage.tambahMemberDeskripsi')}
        confirmLabel={t('common.simpan')}
        loading={createLoading}
        errorMessage={createError}
        onConfirm={handleCreateConfirm}
      >
        <Field label={t('membersPage.kode')} required value={kode} onChange={(e) => setKode(e.target.value)} hint={t('membersPage.kodeHint')} />
        <Field label={t('membersPage.nama')} required value={nama} onChange={(e) => setNama(e.target.value)} />
        <Field label={t('membersPage.kontak')} value={kontak} onChange={(e) => setKontak(e.target.value)} />
        <Field label={t('membersPage.diskonPersen')} required type="number" value={diskonPersen} onChange={(e) => setDiskonPersen(e.target.value)} hint={t('membersPage.diskonHint')} />
      </ConfirmDialog>

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
