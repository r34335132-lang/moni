import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useExpenseReport } from '@/src/hooks/useExpenseReport';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { MonthFinanceSummary } from '@/src/components/MonthFinanceSummary';
import { ExpenseDonutChart } from '@/src/components/ExpenseDonutChart';
import { MonthPickerField } from '@/src/components/ui/MonthPickerField';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { TransactionRow, groupTransactionsByDate } from '@/src/components/TransactionRow';
import { useExportMonthlyReport } from '@/src/hooks/useExportMonthlyReport';
import {
  formatCurrency,
  formatDate,
  getMonthYear,
  isExpenseType,
  isIncomeType,
  INCOME_COLOR,
  EXPENSE_COLOR,
} from '@/src/core/utils/format';

export default function ReportsScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const current = getMonthYear();
  const [month, setMonth] = useState(current.month);
  const [year, setYear] = useState(current.year);
  const [refreshing, setRefreshing] = useState(false);

  const { data: report, isLoading, refetch } = useExpenseReport(month, year);
  const exportPdf = useExportMonthlyReport(month, year);
  const monthLabel = formatDate(new Date(year, month - 1, 1), 'MMMM yyyy');

  const reload = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const spentPct = report && report.incomeTotal > 0
    ? Math.min(100, (report.total / report.incomeTotal) * 100)
    : 0;

  const dayGroups = useMemo(
    () => groupTransactionsByDate((report?.transactions ?? []).filter((tx) => !tx.deleted_at)),
    [report?.transactions],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('reports.title')} showBack subtitle={t('reports.subtitle')} />
      <ScreenContainer refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />}>
        <MonthPickerField label={t('reports.monthLabel')} month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : report ? (
          <>
            <MonthFinanceSummary
              income={report.incomeTotal}
              expenses={report.total}
              currency={currency}
              incomeCount={report.incomeCount}
              expenseCount={report.expenseCount}
            />

            {report.total > 0 && (
              <View style={{ marginBottom: 16 }}>
                <ExpenseDonutChart
                  data={report.slices}
                  total={report.total}
                  currency={currency}
                  title={t('reports.expensesByCategory')}
                  subtitle={t('reports.spentOfIncome', { percent: Math.round(spentPct), month: monthLabel })}
                />
              </View>
            )}

            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
              {t('reports.movementsByDay')}
            </Text>
            {dayGroups.length ? (
              dayGroups.map((group) => {
                const dayIncome = group.data.filter((tx) => isIncomeType(tx.type)).reduce((s, tx) => s + Number(tx.amount), 0);
                const dayExpense = group.data.filter((tx) => isExpenseType(tx.type)).reduce((s, tx) => s + Number(tx.amount), 0);
                return (
                  <View key={group.label} style={{ marginBottom: 18 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '700', textTransform: 'capitalize', flex: 1 }}>
                        {group.label}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '700' }}>
                        {dayIncome > 0 ? (
                          <Text style={{ color: INCOME_COLOR }}>+{formatCurrency(dayIncome, currency)} </Text>
                        ) : null}
                        {dayExpense > 0 ? (
                          <Text style={{ color: EXPENSE_COLOR }}>-{formatCurrency(dayExpense, currency)}</Text>
                        ) : null}
                      </Text>
                    </View>
                    {group.data.map((tx) => (
                      <TransactionRow key={tx.id} transaction={tx} currency={currency} compact />
                    ))}
                  </View>
                );
              })
            ) : (
              <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 }}>
                {t('reports.noMovementsMonth')}
              </Text>
            )}

            <PrimarySaveButton
              title={t('reports.exportPdf', { month: monthLabel })}
              icon="document-text"
              loading={exportPdf.isPending}
              onPress={() => exportPdf.mutate()}
              style={{ marginTop: 8 }}
            />
          </>
        ) : (
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: 32 }}>
            {t('reports.noDataMonth')}
          </Text>
        )}
      </ScreenContainer>
    </View>
  );
}
