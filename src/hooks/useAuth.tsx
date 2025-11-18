import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@/types/supabase';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      setUser(user as User | null);
      try { queryClient.invalidateQueries({ queryKey: ['current-user'] }); } catch (e) {}
      return { user, session };
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Sign in failed');
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // signUp now accepts optional profile data to insert into `profiles` table after account creation.
  const signUp = async (
    email: string,
    password: string,
    profileData?: { username?: string }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      const session = (data as any)?.session ?? null;
      const user = (data as any)?.user ?? session?.user ?? null;

      // FIX: If supabase returned a user immediately (depends on your auth settings), insert profile row
      // Otherwise, return userCreated flag so client can call API endpoint to create profile via service role
      let profileCreated = false;
      let profileError: any = null;

      if (user && user.id) {
        console.log(`[Auth] Attempting to create profile for user ${user.id} with email ${email} and username ${profileData?.username}`);
        
        const profile = {
          id: user.id,
          user_id: user.id,
          email: user.email ?? email,
          username: profileData?.username ?? null,
          created_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from('profiles').insert([profile]);
        if (insertError) {
          // Log the error but don't fail signup - return it so client knows profile creation failed
          console.warn(`[Auth] Profile insert error for user ${user.id}:`, insertError.message || insertError);
          profileError = insertError;
        } else {
          console.log(`[Auth] Profile created successfully for user ${user.id}`);
          profileCreated = true;
        }
      } else {
        console.log('[Auth] No user returned from signUp (email confirmation may be required). Client should call API to create profile.');
      }

      setUser(user as User | null);
      try { queryClient.invalidateQueries({ queryKey: ['current-user'] }); } catch (e) {}
      
      // Return profileError so client can decide to retry via API endpoint
      return { user, session, profileCreated, profileError, needsProfileCreation: !!user && !profileCreated };
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
      try { queryClient.invalidateQueries({ queryKey: ['current-user'] }); } catch (e) {}
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
