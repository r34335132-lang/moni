import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { Profile } from '@/src/core/types/entities';

export const profileRepository = {
  async getById(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, currency, avatar_url, is_premium, created_at, updated_at, deleted_at')
      .eq('id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data;
  },
};
