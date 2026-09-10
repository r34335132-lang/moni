import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { beneficiaryRepository } from '@/src/data/repositories/beneficiaryRepository';
import { beneficiaryService } from '@/src/services/beneficiaryService';
import { transactionRepository } from '@/src/data/repositories/transactionRepository';
import type { BeneficiaryInput } from '@/src/core/validation/schemas';

export function useBeneficiaries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.beneficiaries,
    queryFn: () => beneficiaryRepository.getAll(user!.id),
    enabled: !!user,
  });
}

export function useBeneficiary(id: string) {
  return useQuery({
    queryKey: queryKeys.beneficiary(id),
    queryFn: () => beneficiaryRepository.getById(id),
    enabled: !!id,
  });
}

export function useBeneficiaryTransactions(beneficiaryId: string, beneficiaryName?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.beneficiaryTransactions(beneficiaryId),
    queryFn: async () => {
      const linked = await transactionRepository.getAll(user!.id, { beneficiaryId });
      if (linked.length > 0 || !beneficiaryName) return linked;
      const all = await transactionRepository.getAll(user!.id);
      const name = beneficiaryName.toLowerCase();
      return all.filter(
        (tx) =>
          tx.beneficiary_id === beneficiaryId ||
          tx.description?.toLowerCase().includes(name) ||
          tx.merchant?.toLowerCase().includes(name),
      );
    },
    enabled: !!user && !!beneficiaryId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreateBeneficiary() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BeneficiaryInput) => beneficiaryService.create(user!.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.beneficiaries }),
  });
}

export function useUpdateBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BeneficiaryInput> }) =>
      beneficiaryService.update(id, input),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.beneficiaries });
      qc.invalidateQueries({ queryKey: queryKeys.beneficiary(id) });
    },
  });
}

export function useDeleteBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => beneficiaryService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.beneficiaries }),
  });
}
