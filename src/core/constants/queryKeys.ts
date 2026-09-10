import type { TransactionFilters } from '@/src/data/repositories/transactionRepository';

function normalizeTransactionFilters(filters: TransactionFilters = {}) {
  return {
    type: filters.type ?? null,
    accountId: filters.accountId ?? null,
    categoryId: filters.categoryId ?? null,
    beneficiaryId: filters.beneficiaryId ?? null,
    startDate: filters.startDate ?? null,
    endBefore: filters.endBefore ?? null,
    limit: filters.limit ?? null,
    offset: filters.offset ?? null,
    search: filters.search ?? null,
  };
}

export const queryKeys = {
  profile: ['profile'] as const,
  accounts: ['accounts'] as const,
  account: (id: string) => ['accounts', id] as const,
  categories: ['categories'] as const,
  transactions: (filters?: TransactionFilters) =>
    ['transactions', normalizeTransactionFilters(filters)] as const,
  transaction: (id: string) => ['transaction', id] as const,
  loans: ['loans'] as const,
  loan: (id: string) => ['loans', id] as const,
  loanPayments: (loanId: string) => ['loan-payments', loanId] as const,
  moneyLent: ['money-lent'] as const,
  moneyLentItem: (id: string) => ['money-lent', id] as const,
  moneyLentPayments: (id: string) => ['money-lent-payments', id] as const,
  bankConnections: ['bank-connections'] as const,
  budgets: (month?: number, year?: number) => ['budgets', month, year] as const,
  savingGoals: ['saving-goals'] as const,
  notifications: ['notifications'] as const,
  subscription: ['subscription'] as const,
  dashboard: ['dashboard'] as const,
  beneficiaries: ['beneficiaries'] as const,
  beneficiary: (id: string) => ['beneficiaries', id] as const,
  beneficiaryTransactions: (id: string) => ['beneficiary-transactions', id] as const,
} as const;
