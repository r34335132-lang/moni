import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { LoanInput, MoneyLentInput, BudgetInput, SavingGoalInput } from '@/src/core/validation/schemas';
import { transactionService } from '@/src/services/transactionService';

export const loanService = {
  async create(userId: string, input: LoanInput) {
    const { data, error } = await supabase
      .from('loans')
      .insert({
        ...input,
        user_id: userId,
        remaining_balance: input.amount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async update(id: string, input: Partial<LoanInput & { status?: string; remaining_balance?: number }>) {
    const { data, error } = await supabase.from('loans').update(input).eq('id', id).select().single();
    if (error) handleSupabaseError(error);
    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase.from('loans').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) handleSupabaseError(error);
  },

  async addPayment(userId: string, loanId: string, amount: number, paymentDate: string, accountId?: string | null, notes?: string) {
    const { data: payment, error: payError } = await supabase
      .from('loan_payments')
      .insert({ user_id: userId, loan_id: loanId, amount, payment_date: paymentDate, account_id: accountId ?? null, notes })
      .select()
      .single();

    if (payError) handleSupabaseError(payError);

    const { data: loan } = await supabase.from('loans').select('remaining_balance, lender, account_id').eq('id', loanId).single();
    if (loan) {
      const newBalance = Math.max(0, Number(loan.remaining_balance) - amount);
      await supabase.from('loans').update({
        remaining_balance: newBalance,
        status: newBalance <= 0 ? 'paid_off' : 'pending',
      }).eq('id', loanId);

      const txAccountId = accountId ?? loan.account_id;
      if (txAccountId) {
        await transactionService.create(userId, {
          type: 'loan_payment',
          amount,
          account_id: txAccountId,
          category_id: null,
          merchant: loan.lender ?? null,
          description: notes?.trim() || `Pago de préstamo${loan.lender ? ` · ${loan.lender}` : ''}`,
          tags: ['loan-payment'],
          transaction_date: new Date(`${paymentDate}T12:00:00`).toISOString(),
          transfer_to_account_id: null,
          beneficiary_id: null,
        });
      }
    }

    return payment;
  },
};

export const moneyLentService = {
  async create(userId: string, input: MoneyLentInput) {
    const { data, error } = await supabase
      .from('money_lent')
      .insert({
        ...input,
        user_id: userId,
        remaining_balance: input.amount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async update(id: string, input: Partial<MoneyLentInput & { status?: string; remaining_balance?: number }>) {
    const { data, error } = await supabase.from('money_lent').update(input).eq('id', id).select().single();
    if (error) handleSupabaseError(error);
    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase.from('money_lent').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) handleSupabaseError(error);
  },

  async addPayment(userId: string, moneyLentId: string, amount: number, paymentDate: string, accountId?: string | null, notes?: string) {
    const { data: payment, error: payError } = await supabase
      .from('money_lent_payments')
      .insert({ user_id: userId, money_lent_id: moneyLentId, amount, payment_date: paymentDate, account_id: accountId ?? null, notes })
      .select()
      .single();

    if (payError) handleSupabaseError(payError);

    const { data: item } = await supabase.from('money_lent').select('remaining_balance, debtor_name, account_id').eq('id', moneyLentId).single();
    if (item) {
      const newBalance = Math.max(0, Number(item.remaining_balance) - amount);
      await supabase.from('money_lent').update({
        remaining_balance: newBalance,
        status: newBalance <= 0 ? 'paid_off' : 'pending',
      }).eq('id', moneyLentId);

      const txAccountId = accountId ?? item.account_id;
      if (txAccountId) {
        await transactionService.create(userId, {
          type: 'loan_collection',
          amount,
          account_id: txAccountId,
          category_id: null,
          merchant: item.debtor_name ?? null,
          description: notes?.trim() || `Cobro de préstamo${item.debtor_name ? ` · ${item.debtor_name}` : ''}`,
          tags: ['loan-collection'],
          transaction_date: new Date(`${paymentDate}T12:00:00`).toISOString(),
          transfer_to_account_id: null,
          beneficiary_id: null,
        });
      }
    }

    return payment;
  },
};

export const budgetService = {
  async create(userId: string, input: BudgetInput) {
    const { data, error } = await supabase.from('budgets').insert({ ...input, user_id: userId }).select().single();
    if (error) handleSupabaseError(error);
    return data;
  },

  async update(id: string, input: Partial<BudgetInput>) {
    const { data, error } = await supabase.from('budgets').update(input).eq('id', id).select().single();
    if (error) handleSupabaseError(error);
    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase.from('budgets').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) handleSupabaseError(error);
  },
};

export const savingGoalService = {
  async create(userId: string, input: SavingGoalInput) {
    const { data, error } = await supabase.from('saving_goals').insert({ ...input, user_id: userId }).select().single();
    if (error) handleSupabaseError(error);
    return data;
  },

  async update(id: string, input: Partial<SavingGoalInput>) {
    const { data, error } = await supabase.from('saving_goals').update(input).eq('id', id).select().single();
    if (error) handleSupabaseError(error);
    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase.from('saving_goals').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) handleSupabaseError(error);
  },

  async addFunds(id: string, amount: number) {
    const { data: goal } = await supabase.from('saving_goals').select('current_amount').eq('id', id).single();
    if (!goal) handleSupabaseError({ message: 'Meta no encontrada' });
    const { data, error } = await supabase
      .from('saving_goals')
      .update({ current_amount: Number(goal.current_amount) + amount })
      .eq('id', id)
      .select()
      .single();
    if (error) handleSupabaseError(error);
    return data;
  },
};

export const bankConnectionService = {
  async create(userId: string, institutionName: string) {
    const { data, error } = await supabase
      .from('bank_connections')
      .insert({ user_id: userId, institution_name: institutionName, status: 'pending' })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async disconnect(id: string) {
    const { error } = await supabase
      .from('bank_connections')
      .update({ status: 'disconnected', deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },
};

export const notificationService = {
  async markAsRead(id: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) handleSupabaseError(error);
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    if (error) handleSupabaseError(error);
  },
};
