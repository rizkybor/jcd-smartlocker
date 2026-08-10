import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, Field } from '@smartbox/ui';
import { companyApi, ApiError, type AkunInternalRole } from '../../api/client';

const DIALOG_STYLE = {
  content: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '92vw',
    maxWidth: 420,
    background: '#fff',
    borderRadius: 'var(--sl-radius-lg)',
    boxShadow: 'var(--sl-elev-5)',
    padding: 'var(--sl-space-6)',
    fontFamily: 'var(--sl-font-body)',
  },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(11,27,69,.45)' },
};

export function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AkunInternalRole>('STAFF');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = nama.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await companyApi.users.create({ nama: nama.trim(), email: email.trim(), role });
      setNama('');
      setEmail('');
      setRole('STAFF');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat akun.');
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
            Tambah User Internal
          </Dialog.Title>

          <div style={{ marginTop: 'var(--sl-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
            <Field label="Nama" required value={nama} onChange={(e) => setNama(e.target.value)} />
            <Field label="Email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field
              label="Role"
              required
              options={[
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
                { value: 'OPS', label: 'Ops' },
                { value: 'MANAGER', label: 'Manager' },
                { value: 'STAFF', label: 'Staff' },
              ]}
              value={role}
              onChange={(e) => setRole(e.target.value as AkunInternalRole)}
            />
            {error ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-offline-strong)' }}>{error}</div> : null}
          </div>

          <div style={{ marginTop: 'var(--sl-space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--sl-space-3)' }}>
            <Dialog.Close asChild>
              <Button tone="outline" disabled={submitting}>
                Batal
              </Button>
            </Dialog.Close>
            <Button onClick={handleSubmit} disabled={!valid || submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
