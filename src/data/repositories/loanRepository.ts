import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { Loan, LoanPayment } from '@/src/core/types/entities';

export const loanRepository = {
  async getAll(userId: string): Promise<Loan[]> {
    const { data, error } = await supabase
      .from('loans')
      .select('id, user_id, amount, lender, interest_rate, monthly_payment, due_date, status, notes, remaining_balance, account_id, created_at, updated_at, deleted_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return data ?? [];
  },

  async getById(id: string): Promise<Loan | null> {
    const { data, error } = await supabase
      .from('loans')
      .select('id, user_id, amount, lender, interest_rate, monthly_payment, due_date, status, notes, remaining_balance, account_id, created_at, updated_at, deleted_at')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data;
  },

  async getPayments(loanId: string): Promise<LoanPayment[]> {
    const { data, error } = await supabase
      .from('loan_payments')
      .select('id, loan_id, user_id, amount, payment_date, account_id, notes, created_at, account:accounts(id, name, type, color, icon)')
      .eq('loan_id', loanId)
      .order('payment_date', { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []).map((payment) => ({
      ...payment,
      account: Array.isArray(payment.account) ? (payment.account[0] ?? null) : payment.account ?? null,
    })) as LoanPayment[];
  },
};
