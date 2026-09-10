import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/core/constants/queryKeys';

/** Invalida y recarga TODAS las queries financieras (activas e inactivas) */
export async function invalidateFinanceQueries(qc: QueryClient) {
  const opts = { refetchType: 'all' as const };

  await Promise.all([
    qc.invalidateQueries({ queryKey: ['transactions'], ...opts }),
    qc.invalidateQueries({ queryKey: ['transaction'], ...opts }),
    qc.invalidateQueries({ queryKey: ['expense-report'], ...opts }),
    qc.invalidateQueries({ queryKey: queryKeys.dashboard, ...opts }),
    qc.invalidateQueries({ queryKey: queryKeys.accounts, ...opts }),
    qc.invalidateQueries({ queryKey: ['beneficiaries'], ...opts }),
    qc.invalidateQueries({ queryKey: ['beneficiary-transactions'], ...opts }),
    qc.invalidateQueries({ queryKey: ['budgets'], ...opts }),
    qc.invalidateQueries({ queryKey: queryKeys.savingGoals, ...opts }),
  ]);

  await Promise.all([
    qc.refetchQueries({ queryKey: ['transactions'], type: 'all' }),
    qc.refetchQueries({ queryKey: ['expense-report'], type: 'all' }),
    qc.refetchQueries({ queryKey: queryKeys.dashboard, type: 'all' }),
    qc.refetchQueries({ queryKey: queryKeys.accounts, type: 'all' }),
  ]);
}
