import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { BeneficiaryInput } from '@/src/core/validation/schemas';

export const beneficiaryService = {
  async create(userId: string, input: BeneficiaryInput) {
    const { data, error } = await supabase
      .from('beneficiaries')
      .insert({ ...input, user_id: userId })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async update(id: string, input: Partial<BeneficiaryInput>) {
    const { data, error } = await supabase.from('beneficiaries').update(input).eq('id', id).select().single();
    if (error) handleSupabaseError(error);
    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from('beneficiaries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },
};
