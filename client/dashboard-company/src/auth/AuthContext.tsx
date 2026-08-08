import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { companyApi, type Me } from '../api/client';

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

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    setLoading(true);
    companyApi
      .me()
      .then((res) => setProfile(res.data))
      .catch(() => {
        setProfile(null);
        setError('Akun ini belum terdaftar sebagai akun internal Dashboard Company.');
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
