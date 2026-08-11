import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, DataTable, Button, StatusBadge, ConfirmDialog, useToast, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type AkunInternal, type AkunInternalRole } from '../api/client';
import { CreateUserDialog } from './users/CreateUserDialog';

const ROLE_OPTIONS: AkunInternalRole[] = ['SUPER_ADMIN', 'OPS', 'MANAGER', 'STAFF'];

export function UsersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.users.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AkunInternal | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [roleChangingId, setRoleChangingId] = useState<string | null>(null);

  function reload() {
    companyApi.users
      .list(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('usersPage.gagalMuat')));
  }

  useEffect(reload, [page, t]);

  async function handleRoleChange(user: AkunInternal, role: AkunInternalRole) {
    if (role === user.role) return;
    setRoleChangingId(user.id);
    try {
      await companyApi.users.updateRole(user.id, role);
      toast({ title: t('usersPage.toastRoleDiperbarui'), description: t('usersPage.toastRoleDeskripsi', { nama: user.nama, role }), tone: 'success' });
      reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('usersPage.gagalUbahRole');
      setError(message);
      toast({ title: t('usersPage.gagalUbahRole'), description: message, tone: 'error' });
    } finally {
      setRoleChangingId(null);
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await companyApi.users.remove(removeTarget.id);
      toast({ title: t('usersPage.toastDinonaktifkan'), description: removeTarget.nama, tone: 'success' });
      setRemoveTarget(null);
      reload();
    } catch (err) {
      setRemoveError(err instanceof ApiError ? err.message : t('usersPage.gagalNonaktifkan'));
    } finally {
      setRemoveLoading(false);
    }
  }

  const columns: DataTableColumn<AkunInternal>[] = [
    { header: t('usersPage.kolomNama'), render: (u) => u.nama },
    { header: t('usersPage.kolomEmail'), render: (u) => u.email },
    {
      header: t('usersPage.kolomRole'),
      render: (u) => (
        <select
          value={u.role}
          disabled={roleChangingId === u.id}
          onChange={(e) => void handleRoleChange(u, e.target.value as AkunInternalRole)}
          style={{
            font: 'var(--sl-fw-medium) var(--sl-fs-13)/1 var(--sl-font-body)',
            padding: '4px 8px',
            borderRadius: 'var(--sl-radius-sm)',
            border: 'var(--sl-border-w) solid var(--sl-border-strong)',
            opacity: roleChangingId === u.id ? 0.6 : 1,
          }}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: t('usersPage.kolomStatus'),
      render: (u) => <StatusBadge status={u.deletedAt ? 'nonaktif' : 'tersedia'}>{u.deletedAt ? t('common.nonaktif') : t('common.aktif')}</StatusBadge>,
    },
    {
      header: '',
      align: 'right',
      render: (u) =>
        !u.deletedAt ? (
          <Button tone="danger" size="sm" onClick={() => setRemoveTarget(u)}>
            {t('common.nonaktifkan')}
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sl-space-6)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          {t('usersPage.judul')}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>{t('usersPage.tambahUser')}</Button>
      </div>

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>{t('common.memuat')}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: t('usersPage.itemLabel') }}
          />
        )}
      </Panel>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          reload();
        }}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
            setRemoveError(null);
          }
        }}
        title={t('usersPage.nonaktifkanTitle', { nama: removeTarget?.nama })}
        description={t('usersPage.nonaktifkanDeskripsi')}
        tone="danger"
        confirmLabel={t('common.nonaktifkan')}
        loading={removeLoading}
        errorMessage={removeError}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
