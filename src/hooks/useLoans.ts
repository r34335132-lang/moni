import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { loanRepository } from '@/src/data/repositories/loanRepository';
import { loanService } from '@/src/services/loanService';
import type { LoanInput } from '@/src/core/validation/schemas';

export function useLoans() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.loans,
    queryFn: () => loanRepository.getAll(user!.id),
    enabled: !!user,
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: queryKeys.loan(id),
    queryFn: () => loanRepository.getById(id),
    enabled: !!id,
  });
}

export function useLoanPayments(loanId: string) {
  return useQuery({
    queryKey: queryKeys.loanPayments(loanId),
    queryFn: () => loanRepository.getPayments(loanId),
    enabled: !!loanId,
  });
}

export function useCreateLoan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoanInput) => loanService.create(user!.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.loans }),
  });
}

export function useAddLoanPayment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      amount,
      date,
      accountId,
      notes,
    }: { loanId: string; amount: number; date: string; accountId?: string | null; notes?: string }) =>
      loanService.addPayment(user!.id, loanId, amount, date, accountId, notes),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      qc.invalidateQueries({ queryKey: queryKeys.loanPayments(vars.loanId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loanService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.loans }),
  });
}
