import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { moneyLentRepository } from '@/src/data/repositories/moneyLentRepository';
import { moneyLentService } from '@/src/services/loanService';
import type { MoneyLentInput } from '@/src/core/validation/schemas';

export function useMoneyLent() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.moneyLent,
    queryFn: () => moneyLentRepository.getAll(user!.id),
    enabled: !!user,
  });
}

export function useMoneyLentItem(id: string) {
  return useQuery({
    queryKey: queryKeys.moneyLentItem(id),
    queryFn: () => moneyLentRepository.getById(id),
    enabled: !!id,
  });
}

export function useMoneyLentPayments(id: string) {
  return useQuery({
    queryKey: queryKeys.moneyLentPayments(id),
    queryFn: () => moneyLentRepository.getPayments(id),
    enabled: !!id,
  });
}

export function useCreateMoneyLent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MoneyLentInput) => moneyLentService.create(user!.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.moneyLent }),
  });
}

export function useAddMoneyLentPayment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      date,
      accountId,
      notes,
    }: { id: string; amount: number; date: string; accountId?: string | null; notes?: string }) =>
      moneyLentService.addPayment(user!.id, id, amount, date, accountId, notes),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.moneyLent });
      qc.invalidateQueries({ queryKey: queryKeys.moneyLentPayments(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
