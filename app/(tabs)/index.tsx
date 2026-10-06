import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Alert, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useDashboard } from '@/src/hooks/useDashboard';
import { useExpenseReport } from '@/src/hooks/useExpenseReport';
import { useBudgets } from '@/src/hooks/useBudgets';
import { useTransactions, useDeleteTransaction } from '@/src/hooks/useTransactions';
import { useTheme } from '@/src/hooks/useTheme';
import { SwipeableTransactionRow } from '@/src/components/SwipeableTransactionRow';
import { CategoryBudgetBars, slicesToBarItems } from '@/src/components/CategoryBudgetBars';
import { MonAiDock } from '@/src/components/MonAiDock';
import { DailySummaryCard } from '@/src/components/DailySummaryCard';
import { SavingsProgressCard } from '@/src/components/SavingsProgressCard';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';
import { formatCurrency, formatDate, getDayDateRange, INCOME_COLOR, EXPENSE_COLOR } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';
import { MoneyDisplay } from '@/src/components/ui/MoneyDisplay';

export default function DashboardScreen() {
  const { profile } = useAuth();
  const { colors, radius, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const currency = profile?.currency ?? 'MXN';
  const [refreshing, setRefreshing] = useState(false);

  const dayRange = getDayDateRange();
  const { data: stats, isLoading, refetch: refetchDashboard } = useDashboard();
  const { data: report, refetch: refetchReport } = useExpenseReport();
  const { data: budgets, refetch: refetchBudgets } = useBudgets();
  const { data: recentTx, refetch: refetchRecent } = useTransactions({ limit: 6 });
  const { data: todayTx, refetch: refetchToday } = useTransactions({
    startDate: dayRange.startDate,
    endBefore: dayRange.endBefore,
  });
  const deleteTx = useDeleteTransaction();

  const reload = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDashboard(),
      refetchReport(),
      refetchBudgets(),
      refetchRecent(),
      refetchToday(),
    ]);
    setRefreshing(false);
  }, [refetchDashboard, refetchReport, refetchBudgets, refetchRecent, refetchToday]);

  useFocusEffect(
    useCallback(() => {
      refetchDashboard();
      refetchReport();
      refetchBudgets();
      refetchRecent();
      refetchToday();
    }, [refetchDashboard, refetchReport, refetchBudgets, refetchRecent, refetchToday]),
  );

  const barItems = useMemo(
    () => slicesToBarItems(report?.slices ?? [], budgets),
    [report?.slices, budgets],
  );

  const balance = stats?.totalBalance ?? 0;
  const monthlyIncome = stats?.monthlyIncome ?? 0;
  const monthlyExpenses = stats?.monthlyExpenses ?? 0;
  const budgetLeft = stats?.budgetRemaining;
  const todayIncome = stats?.todayIncome ?? 0;
  const todayExpenses = stats?.todayExpenses ?? 0;
  const todayCount = stats?.todayCount ?? 0;
  const savingsSaved = stats?.savingsSaved ?? 0;
  const savingsTarget = stats?.savingsTarget ?? 0;
  const savingsProgress = stats?.savingGoalsProgress ?? 0;
  const savingGoalsCount = stats?.savingGoalsCount ?? 0;
  const overBudget = useMemo(() => {
    if (!budgets?.length) return null;
    const over = budgets.reduce((sum, b) => {
      const spent = Number(b.spent ?? 0);
      const limit = Number(b.amount);
      return sum + Math.max(0, spent - limit);
    }, 0);
    return over > 0 ? over : null;
  }, [budgets]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top bar */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <PressableScale
          onPress={() => router.push('/accounts')}
          scaleTo={0.97}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.card,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 980,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.25 : 0.06,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          <AppText style={{ fontFamily: Font.semibold, fontSize: 15 }}>{t('dashboard.personal')}</AppText>
          <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
        </PressableScale>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PressableScale
            onPress={() => router.push('/(tabs)/reminders')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.foreground} />
          </PressableScale>
          <PressableScale
            onPress={() => router.push('/(tabs)/profile')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="settings-outline" size={20} color={colors.foreground} />
          </PressableScale>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150, paddingTop: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />}
      >
        {/* Hero balance — MonAi centered */}
        <AnimatedIn>
          <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 18 }}>
            {overBudget != null ? (
              <AppText
                style={{
                  color: colors.destructive,
                  fontFamily: Font.medium,
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                {t('dashboard.overBudget', { amount: formatCurrency(overBudget, currency) })}
              </AppText>
            ) : (
              <AppText style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 8 }}>
                {formatDate(new Date(), 'MMMM yyyy')}
              </AppText>
            )}

            <View style={{ width: '100%', paddingHorizontal: 8, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                <PressableScale
                  onPress={() => router.push('/transaction/add-manual')}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="add" size={22} color={colors.primaryForeground} />
                </PressableScale>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <MoneyDisplay
                    amount={balance}
                    currency={currency}
                    tone={balance < 0 ? 'expense' : 'neutral'}
                    size="xl"
                    staged={false}
                    align="center"
                  />
                </View>
              </View>
            </View>

            {/* Flow chips */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' }}>
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.card,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 980,
                  shadowColor: '#000',
                  shadowOpacity: isDark ? 0.2 : 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 2,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: EXPENSE_COLOR }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <MoneyDisplay amount={monthlyExpenses} currency={currency} tone="expense" size="sm" staged={false} align="left" />
                </View>
              </View>
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.card,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 980,
                  shadowColor: '#000',
                  shadowOpacity: isDark ? 0.2 : 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 2,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: INCOME_COLOR }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <MoneyDisplay amount={monthlyIncome} currency={currency} tone="income" size="sm" staged={false} align="left" />
                </View>
              </View>
            </View>
          </View>
        </AnimatedIn>

        {/* Today + savings */}
        <AnimatedIn index={1}>
          <DailySummaryCard
            income={todayIncome}
            expenses={todayExpenses}
            count={todayCount}
            currency={currency}
            transactions={todayTx ?? []}
          />
        </AnimatedIn>

        <AnimatedIn index={2}>
          <SavingsProgressCard
            saved={savingsSaved}
            target={savingsTarget}
            progress={savingsProgress}
            goalsCount={savingGoalsCount}
            currency={currency}
          />
        </AnimatedIn>

        {/* Category budget bars */}
        <AnimatedIn index={3}>
          <CategoryBudgetBars
            items={barItems}
            onPressEdit={() => router.push('/(tabs)/budgets')}
            emptyLabel={t('dashboard.noCategorySpend')}
          />
        </AnimatedIn>

        {/* Quick budget card */}
        {budgetLeft != null ? (
          <AnimatedIn index={4}>
            <PressableScale
              onPress={() => router.push('/(tabs)/budgets')}
              style={{
                alignSelf: 'center',
                backgroundColor: colors.card,
                borderRadius: radius,
                paddingHorizontal: 18,
                paddingVertical: 14,
                marginTop: 8,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.25 : 0.07,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
                minWidth: 220,
                alignItems: 'center',
              }}
            >
              <AppText style={{ color: colors.mutedForeground, fontSize: 13 }}>{t('dashboard.editBudget')}</AppText>
              <AppText style={{ fontFamily: Font.bold, fontSize: 18, marginTop: 4 }}>
                {formatCurrency(Math.max(0, budgetLeft), currency)} {t('dashboard.remaining')}
              </AppText>
              <AppText style={{ color: colors.primary, fontFamily: Font.semibold, fontSize: 13, marginTop: 6 }}>
                {t('dashboard.newTransaction')} ▾
              </AppText>
            </PressableScale>
          </AnimatedIn>
        ) : null}

        {/* Recent */}
        <AnimatedIn index={5}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <AppText style={{ fontFamily: Font.bold, fontSize: 20 }}>{t('dashboard.recent')}</AppText>
            <Pressable onPress={() => router.push('/(tabs)/transactions')}>
              <AppText style={{ color: colors.mutedForeground, fontFamily: Font.medium, fontSize: 14 }}>
                {t('common.seeAll')}
              </AppText>
            </Pressable>
          </View>
        </AnimatedIn>

        {recentTx?.length ? (
          <AnimatedIn index={6}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: radius,
                paddingHorizontal: 14,
                paddingVertical: 6,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.25 : 0.06,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
              }}
            >
              {recentTx.map((tx, index) => (
                <SwipeableTransactionRow
                  key={tx.id}
                  transaction={tx}
                  currency={currency}
                  isLast={index === recentTx.length - 1}
                  onEdit={() => router.push(`/transaction/add-manual?id=${tx.id}`)}
                  onDelete={() =>
                    deleteTx.mutate(tx.id, {
                      onError: (e) => Alert.alert(t('dashboard.deleteFailed'), getErrorMessage(e)),
                    })
                  }
                />
              ))}
            </View>
          </AnimatedIn>
        ) : (
          <AppText style={{ color: colors.mutedForeground, textAlign: 'center', paddingVertical: 28 }}>
            {t('dashboard.noMovementsHint')}
          </AppText>
        )}
      </ScrollView>

      <MonAiDock
        onAdd={() => router.push('/transaction/add-manual')}
        onVoice={() => router.push('/transaction/add-voice')}
        onPhoto={() => router.push('/transaction/add-photo')}
        onSearch={() => router.push('/(tabs)/transactions')}
      />
    </View>
  );
}
