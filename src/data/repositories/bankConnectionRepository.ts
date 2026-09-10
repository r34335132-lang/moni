import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { BankConnection } from '@/src/core/types/entities';

export const bankConnectionRepository = {
  async getAll(userId: string): Promise<BankConnection[]> {
    const { data, error } = await supabase
      .from('bank_connections')
      .select('id, user_id, institution_name, institution_id, link_id, status, last_sync_at, metadata, created_at, updated_at, deleted_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return data ?? [];
  },
};
