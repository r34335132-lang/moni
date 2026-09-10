import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { SavingGoal } from '@/src/core/types/entities';

export const savingGoalRepository = {
  async getAll(userId: string): Promise<SavingGoal[]> {
    const { data, error } = await supabase
      .from('saving_goals')
      .select('id, user_id, name, target_amount, current_amount, target_date, image_url, created_at, updated_at, deleted_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return data ?? [];
  },
};
