import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { budgetRepository } from '@/src/data/repositories/budgetRepository';
import { transactionRepository } from '@/src/data/repositories/transactionRepository';
import { budgetService } from '@/src/services/loanService';
import type { BudgetInput } from '@/src/core/validation/schemas';
import { getMonthYear, isExpenseType } from '@/src/core/utils/format';
import type { Budget } from '@/src/core/types/entities';

export function useBudgets(month?: number, year?: number) {
  const { user } = useAuth();
  const period = getMonthYear();
  const m = month ?? period.month;
  const y = year ?? period.year;
  return useQuery({
    queryKey: queryKeys.budgets(m, y),
    queryFn: async (): Promise<Budget[]> => {
      const [budgets, transactions] = await Promise.all([
        budgetRepository.getByPeriod(user!.id, m, y),
        transactionRepository.getMonthlyStats(user!.id, m, y),
      ]);
      const expenseByCategory: Record<string, number> = {};
      transactions.filter((t) => isExpenseType(t.type)).forEach((t) => {
        if (t.category_id) {
          expenseByCategory[t.category_id] = (expenseByCategory[t.category_id] ?? 0) + Number(t.amount);
        }
      });
      return budgets.map((b) => ({ ...b, spent: expenseByCategory[b.category_id] ?? 0 }));
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreateBudget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetInput) => budgetService.create(user!.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BudgetInput> }) =>
      budgetService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
