import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { companyApi, ApiError, type Me } from '../api/client';

type AuthState = {
  session: Session | null;
  profile: Me | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * Session Supabase Auth (login) TERPISAH dari profil `AkunInternal`
 * (role) — role tidak ada di klaim JWT, harus di-fetch lewat
 * `GET /company/me` (backend, profile.controller.ts) setiap kali session
 * berubah.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Supabase mengirim OBJECT session BARU di setiap event onAuthStateChange
  // (termasuk TOKEN_REFRESHED berkala & INITIAL_SESSION dobel akibat React
  // StrictMode double-invoke effect di dev) — walau user-nya sama persis.
  // Tanpa dedupe ini, tiap event itu memicu GET /company/me lagi, dan cepat
  // kena limit throttler `default` (60/60s) cuma dari reload berulang saat
  // debugging. Cukup fetch ulang kalau user-nya benar-benar berbeda.
  const fetchedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      fetchedForUserId.current = null;
      return;
    }
    if (fetchedForUserId.current === session.user.id) {
      setLoading(false);
      return;
    }
    fetchedForUserId.current = session.user.id;
    setLoading(true);
    companyApi
      .me()
      .then((res) => setProfile(res.data))
      .catch((err) => {
        setProfile(null);
        fetchedForUserId.current = null;
        // 401/403 dari backend berarti akun ini sungguh belum terdaftar/tidak
        // diizinkan (SupabaseAuthGuard/ProfileController) — selain itu (500,
        // network error, dst.) jangan salah tuduh, itu kegagalan server/
        // jaringan, bukan masalah akun.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setError('Akun ini belum terdaftar sebagai akun internal Dashboard Company.');
        } else {
          setError('Gagal memuat profil akun — server atau jaringan bermasalah. Coba muat ulang halaman.');
        }
      })
      .finally(() => setLoading(false));
  }, [session]);

  async function signIn(email: string, password: string) {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return <AuthContext.Provider value={{ session, profile, loading, error, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth dipakai di luar <AuthProvider>.');
  return ctx;
}
