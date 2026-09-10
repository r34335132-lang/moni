import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { transactionRepository } from '@/src/data/repositories/transactionRepository';
import { buildExpenseSlices } from '@/src/components/ExpenseDonutChart';
import { getMonthYear, getMonthDateRange, isExpenseType, isIncomeType } from '@/src/core/utils/format';

export function useExpenseReport(month?: number, year?: number) {
  const { user } = useAuth();
  const period = getMonthYear();
  const m = month ?? period.month;
  const y = year ?? period.year;

  const { startDate, endBefore } = getMonthDateRange(m, y);

  return useQuery({
    queryKey: ['expense-report', m, y],
    queryFn: async () => {
      const transactions = await transactionRepository.getAll(user!.id, { startDate, endBefore });
      const expenses = transactions.filter((t) => isExpenseType(t.type));
      const incomes = transactions.filter((t) => isIncomeType(t.type));
      const slices = buildExpenseSlices(expenses);
      const total = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
      const incomeTotal = incomes.reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        slices,
        total,
        incomeTotal,
        expenses,
        incomes,
        transactions,
        expenseCount: expenses.length,
        incomeCount: incomes.length,
      };
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
