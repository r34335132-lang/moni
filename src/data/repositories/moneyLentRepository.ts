import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { MoneyLent, MoneyLentPayment } from '@/src/core/types/entities';

export const moneyLentRepository = {
  async getAll(userId: string): Promise<MoneyLent[]> {
    const { data, error } = await supabase
      .from('money_lent')
      .select('id, user_id, debtor_name, amount, lent_date, concept, status, remaining_balance, account_id, created_at, updated_at, deleted_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return data ?? [];
  },

  async getById(id: string): Promise<MoneyLent | null> {
    const { data, error } = await supabase
      .from('money_lent')
      .select('id, user_id, debtor_name, amount, lent_date, concept, status, remaining_balance, account_id, created_at, updated_at, deleted_at')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data;
  },

  async getPayments(moneyLentId: string): Promise<MoneyLentPayment[]> {
    const { data, error } = await supabase
      .from('money_lent_payments')
      .select('id, money_lent_id, user_id, amount, payment_date, account_id, notes, created_at, account:accounts(id, name, type, color, icon)')
      .eq('money_lent_id', moneyLentId)
      .order('payment_date', { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []).map((payment) => ({
      ...payment,
      account: Array.isArray(payment.account) ? (payment.account[0] ?? null) : payment.account ?? null,
    })) as MoneyLentPayment[];
  },
};
