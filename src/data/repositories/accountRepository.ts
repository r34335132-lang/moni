import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { Account } from '@/src/core/types/entities';

export const accountRepository = {
  async getAll(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, user_id, name, type, balance, icon, color, is_default, created_at, updated_at, deleted_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) handleSupabaseError(error);
    return data ?? [];
  },

  async getById(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, user_id, name, type, balance, icon, color, is_default, created_at, updated_at, deleted_at')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data;
  },
};
