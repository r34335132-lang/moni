import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/data/supabase/client';
import { authService } from '@/src/services/authService';
import { subscriptionService } from '@/src/services/subscriptionService';
import { profileRepository } from '@/src/data/repositories/profileRepository';
import { isJwtClockError } from '@/src/core/utils/errors';
import type { Profile } from '@/src/core/types/entities';
import type { LoginInput, RegisterInput } from '@/src/core/validation/schemas';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isPremium: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearLocalAuth = useCallback(() => {
    setSession(null);
    setProfile(null);
    queryClient.clear();
  }, [queryClient]);

  const forceLocalSignOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    clearLocalAuth();
    router.replace('/(auth)/login');
  }, [clearLocalAuth]);

  const loadProfile = useCallback(
    async (userId: string) => {
      try {
        const data = await profileRepository.getById(userId);
        setProfile(data);
      } catch (error) {
        if (!isJwtClockError(error)) throw error;
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !data.session) {
          await forceLocalSignOut();
          return;
        }
        setSession(data.session);
        try {
          const retry = await profileRepository.getById(userId);
          setProfile(retry);
        } catch {
          await forceLocalSignOut();
        }
      }
    },
    [forceLocalSignOut],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (error && isJwtClockError(error)) {
        forceLocalSignOut().finally(() => setIsLoading(false));
        return;
      }
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id).catch(() => undefined);
        subscriptionService.configure(s.user.id);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id).catch(() => undefined);
        subscriptionService.configure(s.user.id);
      } else {
        setProfile(null);
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile, forceLocalSignOut, queryClient]);

  const signIn = async (input: LoginInput) => {
    const { session: s } = await authService.signIn(input);
    setSession(s);
    if (s?.user) await loadProfile(s.user.id);
  };

  const signUp = async (input: RegisterInput) => {
    const { session: s } = await authService.signUp(input);
    setSession(s);
    if (s?.user) await loadProfile(s.user.id);
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    } finally {
      clearLocalAuth();
      router.replace('/(auth)/login');
    }
  };

  const deleteAccount = async () => {
    if (!session?.user) return;
    try {
      await authService.deleteAccount(session.user.id);
    } finally {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      clearLocalAuth();
      router.replace('/(auth)/login');
    }
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        isPremium: profile?.is_premium ?? false,
        signIn,
        signUp,
        signOut,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
