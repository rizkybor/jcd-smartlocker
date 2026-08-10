import { useEffect, useState } from 'react';
import { Panel, DataTable, Button, StatusBadge, ConfirmDialog, useToast, type DataTableColumn } from '@smartbox/ui';
import { companyApi, ApiError, type AkunInternal, type AkunInternalRole } from '../api/client';
import { CreateUserDialog } from './users/CreateUserDialog';

const ROLE_OPTIONS: AkunInternalRole[] = ['SUPER_ADMIN', 'OPS', 'MANAGER', 'STAFF'];

export function UsersPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof companyApi.users.list>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AkunInternal | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  function reload() {
    companyApi.users
      .list(page)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat daftar user.'));
  }

  useEffect(reload, [page]);

  async function handleRoleChange(user: AkunInternal, role: AkunInternalRole) {
    if (role === user.role) return;
    try {
      await companyApi.users.updateRole(user.id, role);
      toast({ title: 'Role diperbarui', description: `${user.nama} sekarang ${role}.`, tone: 'success' });
      reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal mengubah role.';
      setError(message);
      toast({ title: 'Gagal mengubah role', description: message, tone: 'error' });
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await companyApi.users.remove(removeTarget.id);
      toast({ title: 'Akun dinonaktifkan', description: removeTarget.nama, tone: 'success' });
      setRemoveTarget(null);
      reload();
    } catch (err) {
      setRemoveError(err instanceof ApiError ? err.message : 'Gagal menonaktifkan akun.');
    } finally {
      setRemoveLoading(false);
    }
  }

  const columns: DataTableColumn<AkunInternal>[] = [
    { header: 'Nama', render: (u) => u.nama },
    { header: 'Email', render: (u) => u.email },
    {
      header: 'Role',
      render: (u) => (
        <select
          value={u.role}
          onChange={(e) => void handleRoleChange(u, e.target.value as AkunInternalRole)}
          style={{ font: 'var(--sl-fw-medium) var(--sl-fs-13)/1 var(--sl-font-body)', padding: '4px 8px', borderRadius: 'var(--sl-radius-sm)', border: 'var(--sl-border-w) solid var(--sl-border-strong)' }}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
    { header: 'Status', render: (u) => <StatusBadge status={u.deletedAt ? 'nonaktif' : 'tersedia'}>{u.deletedAt ? 'Nonaktif' : 'Aktif'}</StatusBadge> },
    {
      header: '',
      align: 'right',
      render: (u) =>
        !u.deletedAt ? (
          <Button tone="danger" size="sm" onClick={() => setRemoveTarget(u)}>
            Nonaktifkan
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sl-space-6)' }}>
        <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', margin: 0 }}>
          Manajemen User
        </h1>
        <Button onClick={() => setCreateOpen(true)}>+ Tambah User</Button>
      </div>

      <Panel>
        {error ? (
          <div style={{ color: 'var(--sl-status-offline-strong)' }}>{error}</div>
        ) : !result ? (
          <div style={{ color: 'var(--sl-text-muted)' }}>Memuat...</div>
        ) : (
          <DataTable
            columns={columns}
            rows={result.data}
            striped
            pagination={{ meta: result.meta, onPageChange: setPage, itemLabel: 'user' }}
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
        title={`Nonaktifkan ${removeTarget?.nama}?`}
        description="Akun tidak bisa login lagi sampai diaktifkan ulang oleh Super Admin."
        tone="danger"
        confirmLabel="Nonaktifkan"
        loading={removeLoading}
        errorMessage={removeError}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
