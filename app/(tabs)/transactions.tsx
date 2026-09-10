import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Pressable, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTransactions, useDeleteTransaction } from '@/src/hooks/useTransactions';
import { useExpenseReport } from '@/src/hooks/useExpenseReport';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { groupTransactionsByDate } from '@/src/components/TransactionRow';
import { SwipeableTransactionRow } from '@/src/components/SwipeableTransactionRow';
import { EmptyState } from '@/src/components/EmptyState';
import { FabMenu } from '@/src/components/FabMenu';
import { MonthFinanceSummary } from '@/src/components/MonthFinanceSummary';
import { SearchBar, FilterChip } from '@/src/components/ui/SearchBar';
import { MonthPickerField } from '@/src/components/ui/MonthPickerField';
import { formatDate, getMonthDateRange, getMonthYear, isIncomeType, isExpenseType, INCOME_COLOR, EXPENSE_COLOR } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';
import type { Transaction } from '@/src/core/types/entities';

type FilterType = 'all' | 'expense' | 'income';

function filterBySearch(transactions: Transaction[], search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return transactions;
  return transactions.filter(
    (tx) =>
      tx.description?.toLowerCase().includes(q) ||
      tx.merchant?.toLowerCase().includes(q) ||
      tx.category?.name?.toLowerCase().includes(q) ||
      formatDate(tx.transaction_date, 'd MMM yyyy').toLowerCase().includes(q),
  );
}

export default function TransactionsScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const current = getMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(current.month);
  const [selectedYear, setSelectedYear] = useState(current.year);

  const { startDate, endBefore } = getMonthDateRange(selectedMonth, selectedYear);
  const typeFilter = filter === 'all' ? undefined : filter;
  const {
    data: rawTransactions,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTransactions({ ...(typeFilter ? { type: typeFilter } : {}), startDate, endBefore });
  const { data: report, refetch: refetchReport } = useExpenseReport(selectedMonth, selectedYear);
  const deleteTx = useDeleteTransaction();

  const reload = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchReport()]);
    setRefreshing(false);
  }, [refetch, refetchReport]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchReport();
    }, [refetch, refetchReport]),
  );

  const transactions = useMemo(
    () => filterBySearch(rawTransactions ?? [], search),
    [rawTransactions, search],
  );

  const incomeList = useMemo(() => transactions.filter((tx) => isIncomeType(tx.type)), [transactions]);
  const expenseList = useMemo(() => transactions.filter((tx) => isExpenseType(tx.type)), [transactions]);

  const monthLabel = formatDate(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy');

  const handleDelete = (txId: string) => {
    deleteTx.mutate(txId, {
      onError: (e) => Alert.alert(t('dashboard.deleteFailed'), getErrorMessage(e)),
    });
  };

  const renderGroup = (list: Transaction[]) =>
    groupTransactionsByDate(list).map((group) => (
      <View key={group.label} style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'capitalize' }}>
          {group.label}
        </Text>
        {group.data.map((tx) => (
          <SwipeableTransactionRow
            key={tx.id}
            transaction={tx}
            currency={profile?.currency}
            onEdit={() => router.push(`/transaction/add-manual?id=${tx.id}`)}
            onDelete={() => handleDelete(tx.id)}
          />
        ))}
      </View>
    ));

  const hasData = transactions.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('transactions.title')} showBack subtitle={monthLabel} />

      <View style={{ paddingHorizontal: 16, marginBottom: 12, gap: 12 }}>
        <MonthPickerField
          month={selectedMonth}
          year={selectedYear}
          onChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
        />
        <SearchBar value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip label={`${t('transactions.all')}${report ? ` (${report.transactions.length})` : ''}`} active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label={`${t('transactions.incomes')}${report ? ` (${report.incomeCount})` : ''}`} active={filter === 'income'} onPress={() => setFilter('income')} />
          <FilterChip label={`${t('transactions.expenses')}${report ? ` (${report.expenseCount})` : ''}`} active={filter === 'expense'} onPress={() => setFilter('expense')} />
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />}
      >
        {report && (
          <MonthFinanceSummary
            income={report.incomeTotal}
            expenses={report.total}
            currency={profile?.currency}
            incomeCount={report.incomeCount}
            expenseCount={report.expenseCount}
          />
        )}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : isError ? (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
            <Text style={{ color: colors.destructive, textAlign: 'center' }}>{getErrorMessage(error)}</Text>
            <Pressable onPress={() => reload()} style={{ padding: 12 }}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : hasData ? (
          <>
            {filter === 'all' ? (
              <>
                {incomeList.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: INCOME_COLOR, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>{t('transactions.incomes')} ({incomeList.length})</Text>
                    {renderGroup(incomeList)}
                  </View>
                )}
                {expenseList.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: EXPENSE_COLOR, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>{t('transactions.expenses')} ({expenseList.length})</Text>
                    {renderGroup(expenseList)}
                  </View>
                )}
              </>
            ) : (
              renderGroup(transactions)
            )}
          </>
        ) : (
          <EmptyState
            title={search ? t('transactions.noResults') : t('transactions.empty')}
            subtitle={search ? t('transactions.noResultsSub') : t('transactions.emptySub')}
            icon="swap-horizontal-outline"
            actionLabel={search ? undefined : t('transactions.addMovement')}
            onAction={search ? undefined : () => router.push('/transaction/add-manual')}
          />
        )}

        {isFetching && !isLoading && hasData ? (
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', fontSize: 12, marginTop: 8 }}>{t('transactions.updating')}</Text>
        ) : null}
      </ScrollView>

      <FabMenu
        onManual={() => router.push('/transaction/add-manual')}
        onVoice={() => router.push('/transaction/add-voice')}
        onPhoto={() => router.push('/transaction/add-photo')}
      />
    </View>
  );
}
