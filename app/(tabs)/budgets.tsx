import React, { useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBudgets } from '@/src/hooks/useBudgets';
import { useSavingGoals } from '@/src/hooks/useSavingGoals';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card, SectionLabel } from '@/src/components/ui/Card';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { EmptyState } from '@/src/components/EmptyState';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';
import { formatCurrency } from '@/src/core/utils/format';
import { getCategoryIcon } from '@/src/core/constants/categories';
import { MoneyDisplay } from '@/src/components/ui/MoneyDisplay';

export default function BudgetsScreen() {
  const { profile } = useAuth();
  const { colors, radiusPill, isDark } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const { data: budgets, isLoading: loadingBudgets } = useBudgets();
  const { data: goals, isLoading: loadingGoals } = useSavingGoals();

  const totals = useMemo(() => {
    const list = budgets ?? [];
    const limit = list.reduce((s, b) => s + Number(b.amount), 0);
    const spent = list.reduce((s, b) => s + Number(b.spent ?? 0), 0);
    return { limit, spent, left: Math.max(0, limit - spent) };
  }, [budgets]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('budgets.title')} subtitle={t('budgets.subtitle')} />
      <ScreenContainer>
        <AnimatedIn>
          <Card style={{ marginBottom: 18 }} padding={16}>
            <MoneyDisplay
              amount={totals.left}
              currency={currency}
              tone="primary"
              size="xl"
              label={t('dashboard.remaining')}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <View
                style={{
                  flex: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: radiusPill,
                  backgroundColor: colors.fill,
                  minWidth: 0,
                }}
              >
                <AppText style={{ fontSize: 11, fontFamily: Font.medium, color: colors.mutedForeground, marginBottom: 4 }}>
                  {t('common.expense')}
                </AppText>
                <MoneyDisplay amount={totals.spent} currency={currency} tone="expense" size="sm" staged={false} align="left" />
              </View>
              <View
                style={{
                  flex: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: radiusPill,
                  backgroundColor: colors.fill,
                  minWidth: 0,
                }}
              >
                <AppText style={{ fontSize: 11, fontFamily: Font.medium, color: colors.mutedForeground, marginBottom: 4 }}>
                  {t('budgets.monthBudgets')}
                </AppText>
                <MoneyDisplay amount={totals.limit} currency={currency} tone="neutral" size="sm" staged={false} align="left" />
              </View>
            </View>
          </Card>
        </AnimatedIn>

        <AnimatedIn index={1}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
            <PressableScale
              onPress={() => router.push('/budgets/create')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.primary,
                borderRadius: radiusPill,
                paddingVertical: 15,
                shadowColor: colors.primary,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }}
            >
              <Ionicons name="add" size={20} color={colors.primaryForeground} />
              <AppText style={{ color: colors.primaryForeground, fontFamily: Font.semibold, fontSize: 15 }}>
                {t('budgets.budgetShort')}
              </AppText>
            </PressableScale>
            <PressableScale
              onPress={() => router.push('/savings-goals/create')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.card,
                borderRadius: radiusPill,
                paddingVertical: 15,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.25 : 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}
            >
              <Ionicons name="flag-outline" size={18} color={colors.primary} />
              <AppText style={{ color: colors.foreground, fontFamily: Font.semibold, fontSize: 15 }}>
                {t('budgets.goalShort')}
              </AppText>
            </PressableScale>
          </View>
        </AnimatedIn>

        <SectionLabel>{t('budgets.monthBudgets')}</SectionLabel>

        {loadingBudgets ? (
          <ActivityIndicator color={colors.primary} />
        ) : budgets?.length ? (
          budgets.map((b, index) => {
            const spent = b.spent ?? 0;
            const progress = (spent / Number(b.amount)) * 100;
            const isNearLimit = progress >= Number(b.alert_threshold);
            const catColor = b.category?.color ?? colors.primary;
            const catName = b.category?.name ?? t('budgets.category');
            const left = Math.max(0, Number(b.amount) - spent);

            return (
              <AnimatedIn key={b.id} index={index}>
                <Card style={{ marginBottom: 10 }} padding={16}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: `${catColor}22`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={getCategoryIcon(b.category?.icon)} size={22} color={catColor} />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText style={{ fontFamily: Font.semibold, fontSize: 17 }} numberOfLines={1}>
                        {catName}
                      </AppText>
                      <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
                        {formatCurrency(left, currency)} {t('dashboard.remaining')}
                      </AppText>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: radiusPill,
                        backgroundColor: isNearLimit ? 'rgba(229,72,77,0.12)' : colors.fill,
                      }}
                    >
                      <AppText
                        style={{
                          color: isNearLimit ? colors.destructive : colors.foreground,
                          fontSize: 14,
                          fontFamily: Font.bold,
                        }}
                      >
                        {Math.round(Math.min(progress, 999))}%
                      </AppText>
                    </View>
                  </View>
                  <ProgressBar
                    progress={progress}
                    color={isNearLimit ? colors.destructive : catColor}
                    showLabel={false}
                  />
                  <AppText style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8 }}>
                    {t('budgets.ofAmount', {
                      current: formatCurrency(spent, currency),
                      target: formatCurrency(Number(b.amount), currency),
                    })}
                  </AppText>
                </Card>
              </AnimatedIn>
            );
          })
        ) : (
          <EmptyState title={t('budgets.empty')} subtitle={t('budgets.emptySub')} icon="pie-chart-outline" />
        )}

        <SectionLabel>{t('profile.savingsGoals')}</SectionLabel>

        {loadingGoals ? (
          <ActivityIndicator color={colors.primary} />
        ) : goals?.length ? (
          goals.map((g, index) => {
            const progress = (Number(g.current_amount) / Number(g.target_amount)) * 100;
            return (
              <AnimatedIn key={g.id} index={index} delay={40}>
                <Card style={{ marginBottom: 10 }} padding={16}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="flag" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText style={{ fontFamily: Font.semibold, fontSize: 17 }} numberOfLines={1}>
                        {g.name}
                      </AppText>
                      <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
                        {t('budgets.ofAmount', {
                          current: formatCurrency(Number(g.current_amount), currency),
                          target: formatCurrency(Number(g.target_amount), currency),
                        })}
                      </AppText>
                    </View>
                  </View>
                  <ProgressBar progress={progress} color={colors.primary} showLabel />
                </Card>
              </AnimatedIn>
            );
          })
        ) : (
          <EmptyState title={t('budgets.noGoals')} subtitle={t('budgets.noGoalsSub')} icon="flag-outline" />
        )}
      </ScreenContainer>
    </View>
  );
}
