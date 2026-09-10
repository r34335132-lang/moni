import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { savingGoalRepository } from '@/src/data/repositories/savingGoalRepository';
import { savingGoalService } from '@/src/services/loanService';
import type { SavingGoalInput } from '@/src/core/validation/schemas';

export function useSavingGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.savingGoals,
    queryFn: () => savingGoalRepository.getAll(user!.id),
    enabled: !!user,
  });
}

export function useCreateSavingGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SavingGoalInput) => savingGoalService.create(user!.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.savingGoals }),
  });
}

export function useUpdateSavingGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SavingGoalInput> }) =>
      savingGoalService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.savingGoals }),
  });
}

export function useAddSavingGoalFunds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      savingGoalService.addFunds(id, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.savingGoals }),
  });
}

export function useDeleteSavingGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savingGoalService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.savingGoals }),
  });
}
