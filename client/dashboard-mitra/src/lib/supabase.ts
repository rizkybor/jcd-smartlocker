import { createClient } from '@supabase/supabase-js';

/**
 * Login Supabase Auth terjadi LANGSUNG dari browser (§9.2) — backend cuma
 * memverifikasi JWT yang sudah ada (SupabaseAuthGuard), tidak pernah jadi
 * perantara proses login itu sendiri. Session disimpan Supabase JS SDK
 * sendiri (localStorage), auto-refresh token.
 */
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
