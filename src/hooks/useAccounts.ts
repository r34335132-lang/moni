import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { accountRepository } from '@/src/data/repositories/accountRepository';
import { accountService } from '@/src/services/transactionService';
import type { AccountInput } from '@/src/core/validation/schemas';

export function useAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => accountRepository.getAll(user!.id),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.account(id),
    queryFn: () => accountRepository.getById(id),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreateAccount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountInput) => accountService.create(user!.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AccountInput> }) =>
      accountService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}
