import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import { getMonthDateRange } from '@/src/core/utils/format';
import type { Transaction } from '@/src/core/types/entities';

export interface TransactionFilters {
  type?: string;
  accountId?: string;
  categoryId?: string;
  beneficiaryId?: string;
  startDate?: string;
  /** Límite superior exclusivo (lt). Preferir sobre endDate. */
  endBefore?: string;
  /** @deprecated Usar endBefore */
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

const TRANSACTION_SELECT = `
  id, user_id, account_id, category_id, type, amount, merchant, description,
  tags, transaction_date, transfer_to_account_id, loan_id, money_lent_id, beneficiary_id,
  created_at, updated_at, deleted_at,
  account:accounts!account_id(id, name, icon, color),
  category:categories(id, name, icon, color)
`;

export const transactionRepository = {
  async getAll(userId: string, filters: TransactionFilters = {}): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false });

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.accountId) {
      query = query.or(`account_id.eq.${filters.accountId},transfer_to_account_id.eq.${filters.accountId}`);
    }
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters.beneficiaryId) query = query.eq('beneficiary_id', filters.beneficiaryId);
    if (filters.startDate) query = query.gte('transaction_date', filters.startDate);
    if (filters.endBefore) query = query.lt('transaction_date', filters.endBefore);
    else if (filters.endDate) query = query.lte('transaction_date', filters.endDate);
    if (filters.search) {
      query = query.or(`description.ilike.%${filters.search}%,merchant.ilike.%${filters.search}%`);
    }
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);

    const { data, error } = await query;
    if (error) handleSupabaseError(error);
    return (data ?? []) as unknown as Transaction[];
  },

  async getById(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data as unknown as Transaction | null;
  },

  async getMonthlyStats(userId: string, month: number, year: number) {
    const { startDate, endBefore } = getMonthDateRange(month, year);

    const { data, error } = await supabase
      .from('transactions')
      .select('type, amount, category_id, transaction_date')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('transaction_date', startDate)
      .lt('transaction_date', endBefore);

    if (error) handleSupabaseError(error);
    return data ?? [];
  },
};
