import React, { useMemo, useState, useCallback } from 'react';
import { View, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
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
import { MonAiDock } from '@/src/components/MonAiDock';
import { SearchBar, FilterChip } from '@/src/components/ui/SearchBar';
import { MonthPickerField } from '@/src/components/ui/MonthPickerField';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';
import { SectionLabel } from '@/src/components/ui/Card';
import {
  formatCurrency,
  formatDate,
  getMonthDateRange,
  getMonthYear,
  isIncomeType,
  isExpenseType,
  INCOME_COLOR,
  EXPENSE_COLOR,
} from '@/src/core/utils/format';
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
  const { colors, radius, isDark } = useTheme();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const current = getMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(current.month);
  const [selectedYear, setSelectedYear] = useState(current.year);

  const searchQuery = search.trim();
  const isSearching = searchQuery.length > 0;
  const { startDate, endBefore } = getMonthDateRange(selectedMonth, selectedYear);
  const typeFilter = filter === 'all' ? undefined : filter;
  const txFilters = useMemo(
    () =>
      isSearching
        ? {
            ...(typeFilter ? { type: typeFilter } : {}),
            search: searchQuery,
            limit: 200,
          }
        : {
            ...(typeFilter ? { type: typeFilter } : {}),
            startDate,
            endBefore,
          },
    [isSearching, searchQuery, typeFilter, startDate, endBefore],
  );
  const {
    data: rawTransactions,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTransactions(txFilters);
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

  const transactions = useMemo(() => {
    const list = rawTransactions ?? [];
    if (!isSearching) return filterBySearch(list, search);
    // Server already filtered by search; keep client filter for category name too
    return filterBySearch(list, search);
  }, [rawTransactions, search, isSearching]);

  const incomeList = useMemo(() => transactions.filter((tx) => isIncomeType(tx.type)), [transactions]);
  const expenseList = useMemo(() => transactions.filter((tx) => isExpenseType(tx.type)), [transactions]);

  const monthLabel = formatDate(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy');
  const currency = profile?.currency ?? 'MXN';

  const otherMonthLabelFor = useCallback(
    (tx: Transaction) => {
      if (!isSearching) return null;
      const d = new Date(tx.transaction_date);
      const txMonth = d.getMonth() + 1;
      const txYear = d.getFullYear();
      if (txMonth === selectedMonth && txYear === selectedYear) return null;
      return t('transactions.otherMonth', {
        month: formatDate(d, 'MMMM yyyy'),
      });
    },
    [isSearching, selectedMonth, selectedYear, t],
  );

  const handleDelete = (txId: string) => {
    deleteTx.mutate(txId, {
      onError: (e) => Alert.alert(t('dashboard.deleteFailed'), getErrorMessage(e)),
    });
  };

  const cardStyle = {
    backgroundColor: colors.card,
    borderRadius: radius,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.25 : 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  };

  const renderGroup = (list: Transaction[], animOffset = 0) =>
    groupTransactionsByDate(list).map((group, gIndex) => {
      const dayTotal = group.data.reduce((s, tx) => {
        const amt = Number(tx.amount);
        return s + (isIncomeType(tx.type) ? amt : -amt);
      }, 0);
      return (
        <AnimatedIn key={group.label} index={animOffset + gIndex}>
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
              <AppText
                style={{
                  color: colors.mutedForeground,
                  fontSize: 13,
                  fontFamily: Font.semibold,
                  textTransform: 'capitalize',
                }}
              >
                {group.label}
              </AppText>
              <AppText style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: Font.medium }}>
                {formatCurrency(Math.abs(dayTotal), currency)}
              </AppText>
            </View>
            <View style={cardStyle}>
              {group.data.map((tx, index) => (
                <SwipeableTransactionRow
                  key={tx.id}
                  transaction={tx}
                  currency={currency}
                  isLast={index === group.data.length - 1}
                  otherMonthLabel={otherMonthLabelFor(tx)}
                  onEdit={() => router.push(`/transaction/add-manual?id=${tx.id}`)}
                  onDelete={() => handleDelete(tx.id)}
                />
              ))}
            </View>
          </View>
        </AnimatedIn>
      );
    });

  const hasData = transactions.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('transactions.title')}
        showBack
        subtitle={isSearching ? t('transactions.searchAllHint') : monthLabel}
      />

      <View style={{ paddingHorizontal: 20, marginBottom: 12, gap: 12 }}>
        {!isSearching ? (
          <MonthPickerField
            month={selectedMonth}
            year={selectedYear}
            onChange={(m, y) => {
              setSelectedMonth(m);
              setSelectedYear(y);
            }}
          />
        ) : null}
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('transactions.searchPlaceholder')} />
        {isSearching ? (
          <AppText style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: Font.medium }}>
            {t('transactions.searchingAll')}
          </AppText>
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label={`${t('transactions.all')}${report ? ` (${report.transactions.length})` : ''}`}
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label={`${t('transactions.incomes')}${report ? ` (${report.incomeCount})` : ''}`}
            active={filter === 'income'}
            onPress={() => setFilter('income')}
          />
          <FilterChip
            label={`${t('transactions.expenses')}${report ? ` (${report.expenseCount})` : ''}`}
            active={filter === 'expense'}
            onPress={() => setFilter('expense')}
          />
        </ScrollView>

        {report ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.card,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 980,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.2 : 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 2,
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: EXPENSE_COLOR }} />
              <AppText style={{ fontFamily: Font.semibold, fontSize: 14 }} numberOfLines={1}>
                − {formatCurrency(report.total, currency)}
              </AppText>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.card,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 980,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.2 : 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 2,
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: INCOME_COLOR }} />
              <AppText style={{ fontFamily: Font.semibold, fontSize: 14 }} numberOfLines={1}>
                + {formatCurrency(report.incomeTotal, currency)}
              </AppText>
            </View>
          </View>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : isError ? (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
            <AppText style={{ color: colors.destructive, textAlign: 'center' }}>{getErrorMessage(error)}</AppText>
            <PressableScale onPress={() => reload()} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 980, backgroundColor: colors.accent }}>
              <AppText style={{ color: colors.primary, fontFamily: Font.semibold }}>{t('common.retry')}</AppText>
            </PressableScale>
          </View>
        ) : hasData ? (
          <>
            {filter === 'all' ? (
              <>
                {incomeList.length > 0 ? (
                  <View style={{ marginBottom: 8 }}>
                    <SectionLabel>{`${t('transactions.incomes')} · ${incomeList.length}`}</SectionLabel>
                    {renderGroup(incomeList, 0)}
                  </View>
                ) : null}
                {expenseList.length > 0 ? (
                  <View style={{ marginBottom: 8 }}>
                    <SectionLabel>{`${t('transactions.expenses')} · ${expenseList.length}`}</SectionLabel>
                    {renderGroup(expenseList, incomeList.length ? 2 : 0)}
                  </View>
                ) : null}
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
          <AppText style={{ color: colors.mutedForeground, textAlign: 'center', fontSize: 12, marginTop: 8 }}>
            {t('transactions.updating')}
          </AppText>
        ) : null}
      </ScrollView>

      <MonAiDock
        onAdd={() => router.push('/transaction/add-manual')}
        onVoice={() => router.push('/transaction/add-voice')}
        onPhoto={() => router.push('/transaction/add-photo')}
        onSearch={() => undefined}
      />
    </View>
  );
}
