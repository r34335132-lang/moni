import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { Category } from '@/src/core/types/entities';

export const categoryRepository = {
  async getAll(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, user_id, name, icon, color, type, is_system, created_at, updated_at, deleted_at')
      .or(`is_system.eq.true,user_id.eq.${userId}`)
      .is('deleted_at', null)
      .order('name');

    if (error) handleSupabaseError(error);
    return data ?? [];
  },

  async getByType(userId: string, type: 'income' | 'expense'): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, user_id, name, icon, color, type, is_system, created_at, updated_at, deleted_at')
      .or(`is_system.eq.true,user_id.eq.${userId}`)
      .in('type', [type, 'both'])
      .is('deleted_at', null)
      .order('name');

    if (error) handleSupabaseError(error);
    return data ?? [];
  },
};
