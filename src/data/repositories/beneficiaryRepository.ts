import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { Beneficiary } from '@/src/core/types/entities';

export const beneficiaryRepository = {
  async getAll(userId: string): Promise<Beneficiary[]> {
    const { data, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('name');

    if (error) handleSupabaseError(error);
    return (data ?? []) as Beneficiary[];
  },

  async getById(id: string): Promise<Beneficiary | null> {
    const { data, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data as Beneficiary | null;
  },
};
