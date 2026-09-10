import { accountRepository } from '@/src/data/repositories/accountRepository';
import { transactionRepository } from '@/src/data/repositories/transactionRepository';
import { loanRepository } from '@/src/data/repositories/loanRepository';
import { moneyLentRepository } from '@/src/data/repositories/moneyLentRepository';
import { budgetRepository } from '@/src/data/repositories/budgetRepository';
import { savingGoalRepository } from '@/src/data/repositories/savingGoalRepository';
import type { DashboardStats } from '@/src/core/types/entities';
import { getMonthYear, isIncomeType, isExpenseType } from '@/src/core/utils/format';

export const dashboardService = {
  async getStats(userId: string): Promise<DashboardStats> {
    const { month, year } = getMonthYear();
    const [accounts, monthlyTx, loans, moneyLent, budgets, goals] = await Promise.all([
      accountRepository.getAll(userId),
      transactionRepository.getMonthlyStats(userId, month, year),
      loanRepository.getAll(userId),
      moneyLentRepository.getAll(userId),
      budgetRepository.getByPeriod(userId, month, year),
      savingGoalRepository.getAll(userId),
    ]);

    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const monthlyIncome = monthlyTx.filter((t) => isIncomeType(t.type)).reduce((s, t) => s + Number(t.amount), 0);
    const monthlyExpenses = monthlyTx.filter((t) => isExpenseType(t.type)).reduce((s, t) => s + Number(t.amount), 0);

    const pendingLoans = loans.filter((l) => l.status === 'pending');
    const pendingDebts = pendingLoans.reduce((s, l) => s + Number(l.remaining_balance), 0);

    const pendingLent = moneyLent.filter((m) => m.status === 'pending');
    const moneyToCollect = pendingLent.reduce((s, m) => s + Number(m.remaining_balance), 0);
    const moneyLentOut = moneyLent.reduce((s, m) => s + Number(m.amount), 0);

    const nextLoan = pendingLoans.find((l) => l.monthly_payment && l.due_date);
    const nextPayment = nextLoan
      ? { amount: Number(nextLoan.monthly_payment), date: nextLoan.due_date!, lender: nextLoan.lender }
      : null;

    const expenseByCategory: Record<string, number> = {};
    monthlyTx.filter((t) => isExpenseType(t.type)).forEach((t) => {
      const catId = t.category_id ?? 'other';
      expenseByCategory[catId] = (expenseByCategory[catId] ?? 0) + Number(t.amount);
    });

    let budgetRemaining = 0;
    budgets.forEach((b) => {
      const spent = expenseByCategory[b.category_id] ?? 0;
      budgetRemaining += Math.max(0, Number(b.amount) - spent);
    });

    const savingGoalsProgress = goals.length
      ? goals.reduce((s, g) => s + (Number(g.current_amount) / Number(g.target_amount)) * 100, 0) / goals.length
      : 0;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      moneyLentOut,
      moneyToCollect,
      pendingDebts,
      nextPayment,
      budgetRemaining,
      savingGoalsProgress,
    };
  },
};
