import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Dipakai di mana pun sebuah akun Supabase Auth dibuat DENGAN password
 * eksplisit (bukan lewat undangan/reset-link) — provisioning Mitra
 * (`mitra.service.ts`) & `prisma/seed-demo.ts`/`seed.ts`. `password` WAJIB
 * disertakan saat `createUser` (bukan di-set belakangan lewat
 * `updateUserById`) — GoTrue baru membuat baris `identities` provider
 * "email" kalau user dibuat DENGAN password sejak awal, kalau tidak
 * `grant_type=password` akan selalu gagal walau password di-set setelahnya
 * (ditemukan & diverifikasi langsung terhadap Supabase saat Epic 3).
 *
 * Kalau email sudah terdaftar di Supabase Auth (mis. setelah `prisma
 * migrate reset` — itu cuma mengosongkan public schema, `auth.users` TIDAK
 * ikut ter-reset), cari user existing-nya lalu SINKRONKAN password ke
 * nilai yang baru diberikan, bukan gagal total.
 */
export async function getOrCreateSupabaseUser(supabase: SupabaseClient, email: string, password?: string) {
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (!created.error && created.data.user) return created.data.user;

  const sudahTerdaftar = created.error?.message?.toLowerCase().includes('already been registered');
  if (!sudahTerdaftar) {
    throw new Error(`Gagal membuat akun Supabase Auth untuk ${email}: ${created.error?.message ?? 'unknown error'}`);
  }

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`Gagal mencari akun Supabase Auth existing untuk ${email}: ${error.message}`);
  const existing = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) throw new Error(`Supabase bilang ${email} sudah terdaftar, tapi tidak ketemu di listUsers().`);

  const updated = await supabase.auth.admin.updateUserById(existing.id, { password });
  if (updated.error || !updated.data.user) {
    throw new Error(`Gagal sinkronkan password akun Supabase Auth existing ${email}: ${updated.error?.message ?? 'unknown error'}`);
  }
  return updated.data.user;
}
