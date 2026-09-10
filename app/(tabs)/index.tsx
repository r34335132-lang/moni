import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-gifted-charts';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useDashboard } from '@/src/hooks/useDashboard';
import { useExpenseReport } from '@/src/hooks/useExpenseReport';
import { useTransactions, useDeleteTransaction } from '@/src/hooks/useTransactions';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { StatCard } from '@/src/components/ui/Card';
import { SwipeableTransactionRow } from '@/src/components/SwipeableTransactionRow';
import { FabMenu } from '@/src/components/FabMenu';
import { DailyQuoteCard } from '@/src/components/DailyQuoteCard';
import { MonthFinanceSummary } from '@/src/components/MonthFinanceSummary';
import { formatCurrency, formatDate, INCOME_COLOR } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';

export default function DashboardScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const [refreshing, setRefreshing] = useState(false);
  const { data: stats, isLoading, refetch: refetchDashboard, isFetching } = useDashboard();
  const { data: report, refetch: refetchReport } = useExpenseReport();
  const { data: recentTx, refetch: refetchRecent } = useTransactions({ limit: 5 });
  const deleteTx = useDeleteTransaction();

  const reload = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDashboard(), refetchReport(), refetchRecent()]);
    setRefreshing(false);
  }, [refetchDashboard, refetchReport, refetchRecent]);

  useFocusEffect(
    useCallback(() => {
      refetchDashboard();
      refetchReport();
      refetchRecent();
    }, [refetchDashboard, refetchReport, refetchRecent]),
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const monthlyIncome = stats?.monthlyIncome ?? 0;
  const monthlyExpenses = stats?.monthlyExpenses ?? 0;
  const chartKey = `${monthlyIncome}-${monthlyExpenses}-${stats?.totalBalance ?? 0}`;

  const barData = [
    { value: monthlyIncome, label: t('dashboard.incomeShort'), frontColor: '#22C55E' },
    { value: monthlyExpenses, label: t('dashboard.expenseShort'), frontColor: '#EF4444' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('dashboard.hello', { name: profile?.full_name?.split(' ')[0] ?? t('common.user') })}
        subtitle={formatDate(new Date(), 'MMMM yyyy')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />
        }
      >
        <DailyQuoteCard />

        {report && (
          <MonthFinanceSummary
            income={report.incomeTotal}
            expenses={report.total}
            currency={currency}
            incomeCount={report.incomeCount}
            expenseCount={report.expenseCount}
          />
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard
              key={`bal-${chartKey}`}
              label={t('dashboard.balance')}
              value={formatCurrency(stats?.totalBalance ?? 0, currency)}
              color={(stats?.totalBalance ?? 0) < 0 ? colors.destructive : INCOME_COLOR}
            />
            <StatCard
              key={`inc-${chartKey}`}
              label={t('dashboard.income')}
              value={formatCurrency(monthlyIncome, currency)}
              color={INCOME_COLOR}
            />
            <StatCard
              key={`exp-${chartKey}`}
              label={t('dashboard.expenses')}
              value={formatCurrency(monthlyExpenses, currency)}
              color={colors.destructive}
            />
            <StatCard label={t('dashboard.toCollect')} value={formatCurrency(stats?.moneyToCollect ?? 0, currency)} />
            <StatCard label={t('dashboard.debts')} value={formatCurrency(stats?.pendingDebts ?? 0, currency)} color={colors.destructive} />
            <StatCard label={t('dashboard.budget')} value={formatCurrency(stats?.budgetRemaining ?? 0, currency)} />
          </View>
        </ScrollView>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
            {t('dashboard.incomeVsExpenses')}
          </Text>
          <BarChart
            key={chartKey}
            data={barData}
            barWidth={48}
            spacing={40}
            roundedTop
            noOfSections={4}
            animationDuration={600}
            yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '600' }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', marginBottom: 4 }} />
              <Text style={{ color: INCOME_COLOR, fontSize: 13, fontWeight: '600' }}>
                +{formatCurrency(monthlyIncome, currency)}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', marginBottom: 4 }} />
              <Text style={{ color: colors.destructive, fontSize: 13, fontWeight: '600' }}>
                -{formatCurrency(monthlyExpenses, currency)}
              </Text>
            </View>
          </View>
        </View>

        {stats?.nextPayment && (
          <Pressable
            onPress={() => router.push('/(tabs)/loans')}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.accentForeground, fontSize: 13, fontWeight: '500' }}>{t('dashboard.nextPayment')}</Text>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700', marginTop: 4 }}>
              {formatCurrency(stats.nextPayment.amount, currency)} · {stats.nextPayment.lender}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
              {formatDate(stats.nextPayment.date)}
            </Text>
          </Pressable>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '600' }}>{t('dashboard.recent')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={{ color: colors.primary, fontSize: 14 }}>{t('common.seeAll')}</Text>
          </Pressable>
        </View>

        {recentTx?.length ? (
          recentTx.map((tx) => (
            <SwipeableTransactionRow
              key={tx.id}
              transaction={tx}
              currency={currency}
              onEdit={() => router.push(`/transaction/add-manual?id=${tx.id}`)}
              onDelete={() =>
                deleteTx.mutate(tx.id, {
                  onError: (e) => Alert.alert(t('dashboard.deleteFailed'), getErrorMessage(e)),
                })
              }
            />
          ))
        ) : (
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 20 }}>
            {t('dashboard.noMovementsHint')}
          </Text>
        )}

        {isFetching ? (
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', fontSize: 12, marginTop: 8 }}>
            {t('dashboard.updatingNumbers')}
          </Text>
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
