import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { Budget } from '@/src/core/types/entities';

export const budgetRepository = {
  async getByPeriod(userId: string, month: number, year: number): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        id, user_id, category_id, amount, month, year, alert_threshold,
        created_at, updated_at, deleted_at,
        category:categories(id, name, icon, color)
      `)
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .is('deleted_at', null);

    if (error) handleSupabaseError(error);
    return (data ?? []) as unknown as Budget[];
  },
};
