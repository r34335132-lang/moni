import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import { logger } from '@/src/core/utils/logger';
import type { TransactionInput, AccountInput, CategoryInput } from '@/src/core/validation/schemas';

export const transactionService = {
  async create(userId: string, input: TransactionInput) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...input, user_id: userId })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    logger.info('Transaction', 'Created', { id: data.id });
    return data;
  },

  async update(id: string, input: Partial<TransactionInput>) {
    const { data, error } = await supabase
      .from('transactions')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async softDelete(id: string, userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) handleSupabaseError(error);
    if (!data) {
      handleSupabaseError({ message: 'No se pudo eliminar el movimiento. Intenta de nuevo.' });
    }
    logger.info('Transaction', 'Deleted', { id });
  },

  async addPhoto(userId: string, transactionId: string, storagePath: string, url: string, ocrData?: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('transaction_photos')
      .insert({
        user_id: userId,
        transaction_id: transactionId,
        storage_path: storagePath,
        url,
        ocr_data: ocrData ?? null,
      })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async addVoiceRecord(userId: string, transactionId: string, transcript: string, parsedData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('transaction_voice')
      .insert({
        user_id: userId,
        transaction_id: transactionId,
        raw_transcript: transcript,
        parsed_data: parsedData,
      })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async uploadPhoto(userId: string, uri: string): Promise<{ path: string; url: string }> {
    const ext = uri.split('.').pop() ?? 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from('transaction-photos').upload(path, blob, {
      contentType: `image/${ext}`,
      upsert: false,
    });

    if (error) handleSupabaseError(error);

    const { data: urlData } = supabase.storage.from('transaction-photos').getPublicUrl(path);
    return { path, url: urlData.publicUrl };
  },
};

export const accountService = {
  async create(userId: string, input: AccountInput) {
    if (input.is_default) {
      await supabase.from('accounts').update({ is_default: false }).eq('user_id', userId);
    }
    const { data, error } = await supabase
      .from('accounts')
      .insert({ ...input, user_id: userId })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async update(id: string, input: Partial<AccountInput>) {
    const { data, error } = await supabase.from('accounts').update(input).eq('id', id).select().single();
    if (error) handleSupabaseError(error);
    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase.from('accounts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) handleSupabaseError(error);
  },
};

export const categoryService = {
  async create(userId: string, input: CategoryInput) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...input, user_id: userId, is_system: false })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async update(id: string, input: Partial<CategoryInput>) {
    const { data, error } = await supabase.from('categories').update(input).eq('id', id).select().single();
    if (error) handleSupabaseError(error);
    return data;
  },

  async softDelete(id: string, userId: string) {
    const deletedAt = new Date().toISOString();

    const { error: txError } = await supabase
      .from('transactions')
      .update({ category_id: null })
      .eq('user_id', userId)
      .eq('category_id', id);
    if (txError) handleSupabaseError(txError);

    const { error: budgetError } = await supabase
      .from('budgets')
      .update({ deleted_at: deletedAt })
      .eq('user_id', userId)
      .eq('category_id', id)
      .is('deleted_at', null);
    if (budgetError) handleSupabaseError(budgetError);

    const { data, error } = await supabase
      .from('categories')
      .update({ deleted_at: deletedAt })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_system', false)
      .select('id')
      .maybeSingle();
    if (error) handleSupabaseError(error);
    if (!data) handleSupabaseError({ message: 'No se pudo eliminar la categoría.' });
  },
};

export const profileService = {
  async update(userId: string, data: { full_name?: string; currency?: string; avatar_url?: string }) {
    const { data: profile, error } = await supabase.from('profiles').update(data).eq('id', userId).select().single();
    if (error) handleSupabaseError(error);
    return profile;
  },
};
