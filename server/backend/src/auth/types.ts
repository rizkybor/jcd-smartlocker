import { AkunInternalRole } from '@prisma/client';

/**
 * Hasil resolusi identitas setelah token Supabase Auth diverifikasi
 * (SupabaseAuthGuard) — dua bentuk sesuai dua dashboard di
 * docs/PRD-Smartbox.md §5.4/§5.5: akun internal (Super Admin/Ops/Manager/
 * Staff) atau akun mitra.
 */
export type AuthenticatedInternalUser = {
  kind: 'internal';
  id: string;
  supabaseAuthUid: string;
  email: string;
  role: AkunInternalRole;
};

export type AuthenticatedMitraUser = {
  kind: 'mitra';
  id: string;
  supabaseAuthUid: string;
  email: string;
  mitraId: string;
};

export type AuthenticatedUser = AuthenticatedInternalUser | AuthenticatedMitraUser;

export { AkunInternalRole };
