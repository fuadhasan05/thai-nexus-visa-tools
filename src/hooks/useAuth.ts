import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@/types/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: any }>; 
  signUp: (email: string, password: string) => Promise<{ user: User | null; session: any }>; 
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - provides auth state to the app using Supabase's v2 auth methods.
 * Fixes applied:
 * - On mount calls `supabase.auth.getSession()` to initialize state.
 * - Subscribes to `supabase.auth.onAuthStateChange()` to update state immediately.
 * - Exposes `signIn`, `signUp`, `signOut` that return the supabase result or throw on error.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const session = (data as any)?.session ?? null;
        if (mounted) {
          setUser(session?.user ?? null);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      // session can be null on signed out
      const sess = session as any;
      setUser(sess?.user ?? null);
      setError(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const session = (data as any)?.session ?? null;
      const user = session?.user ?? (data as any)?.user ?? null;
      // update local state immediately
      setUser(user as User | null);
      return { user, session };
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Sign in failed');
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      // Supabase may or may not return a session depending on settings
      const session = (data as any)?.session ?? null;
      const user = (data as any)?.user ?? session?.user ?? null;
      setUser(user as User | null);
      return { user, session };
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Sign up failed');
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Sign out failed');
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };

  // Use non-JSX return to keep this file valid as a plain .ts module
  return React.createElement(AuthContext.Provider, { value }, children) as any;
};

/**
 * useAuth - consumes AuthContext. Ensures all components get the same single source of truth.
 * This replaces the previous local hook which created multiple independent listeners and state.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
