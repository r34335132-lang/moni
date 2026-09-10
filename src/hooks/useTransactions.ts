import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { transactionRepository, type TransactionFilters } from '@/src/data/repositories/transactionRepository';
import { transactionService } from '@/src/services/transactionService';
import { invalidateFinanceQueries } from '@/src/core/utils/invalidateQueries';
import type { TransactionInput } from '@/src/core/validation/schemas';

export function useTransactions(filters: TransactionFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => transactionRepository.getAll(user!.id, filters),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: () => transactionRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => transactionService.create(user!.id, input),
    onSuccess: async () => {
      await invalidateFinanceQueries(qc);
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) =>
      transactionService.update(id, input),
    onSuccess: async () => {
      await invalidateFinanceQueries(qc);
    },
  });
}

export function useDeleteTransaction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionService.softDelete(id, user!.id),
    onSuccess: async (_void, id) => {
      qc.removeQueries({ queryKey: queryKeys.transaction(id) });
      qc.setQueriesData({ queryKey: ['transactions'] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.filter((tx: { id?: string }) => tx.id !== id);
      });
      await invalidateFinanceQueries(qc);
    },
  });
}
