import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import { logger } from '@/src/core/utils/logger';
import type { LoginInput, RegisterInput } from '@/src/core/validation/schemas';

export const authService = {
  async signIn(input: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) handleSupabaseError(error);
    logger.info('Auth', 'User signed in', { userId: data.user?.id });
    return data;
  },

  async signUp(input: RegisterInput) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.fullName } },
    });
    if (error) handleSupabaseError(error);
    logger.info('Auth', 'User registered', { userId: data.user?.id });
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) handleSupabaseError(error);
    logger.info('Auth', 'User signed out');
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) handleSupabaseError(error);
    return data.session;
  },

  async deleteAccount(userId: string) {
    const { error } = await supabase.rpc('delete_user_account', { target_user_id: userId });
    if (error) handleSupabaseError(error);
    logger.info('Auth', 'Account deleted', { userId });
  },
};
