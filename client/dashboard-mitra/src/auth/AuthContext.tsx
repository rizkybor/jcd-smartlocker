import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { mitraApi, ApiError, type Me } from '../api/client';

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
 * Sama pola dengan dashboard-company/src/auth/AuthContext.tsx — session
 * Supabase Auth TERPISAH dari profil AkunMitra, di-fetch lewat
 * `GET /mitra/me` (backend, dashboard-mitra.controller.ts). Dedupe fetch
 * per user id (bukan per event) supaya TOKEN_REFRESHED/StrictMode double
 * effect-invoke tidak memicu request berulang & menabrak rate limit —
 * ditemukan sebagai bug nyata di Dashboard Company sesi ini, langsung
 * diterapkan di sini sejak awal.
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
    mitraApi
      .me()
      .then((res) => setProfile(res.data))
      .catch((err) => {
        setProfile(null);
        fetchedForUserId.current = null;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setError('Akun ini belum terdaftar sebagai akun mitra Dashboard Mitra.');
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
    setError(null);
  }

  return <AuthContext.Provider value={{ session, profile, loading, error, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth dipakai di luar <AuthProvider>.');
  return ctx;
}
