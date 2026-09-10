import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBudgets } from '@/src/hooks/useBudgets';
import { useSavingGoals } from '@/src/hooks/useSavingGoals';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { EmptyState } from '@/src/components/EmptyState';
import { formatCurrency } from '@/src/core/utils/format';

export default function BudgetsScreen() {
  const { profile } = useAuth();
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const { data: budgets, isLoading: loadingBudgets } = useBudgets();
  const { data: goals, isLoading: loadingGoals } = useSavingGoals();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('budgets.title')} subtitle={t('budgets.subtitle')} />
      <ScreenContainer>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <Pressable onPress={() => router.push('/budgets/create')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius, padding: 12 }}>
            <Ionicons name="add" size={20} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>{t('budgets.budgetShort')}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/savings-goals/create')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.secondary, borderRadius: radius, padding: 12, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="flag" size={20} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{t('budgets.goalShort')}</Text>
          </Pressable>
        </View>

        <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '600', marginBottom: 12 }}>{t('budgets.monthBudgets')}</Text>
        {loadingBudgets ? (
          <ActivityIndicator color={colors.primary} />
        ) : budgets?.length ? (
          budgets.map((b) => {
            const spent = b.spent ?? 0;
            const progress = (spent / Number(b.amount)) * 100;
            const isNearLimit = progress >= Number(b.alert_threshold);
            return (
              <Card key={b.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>{b.category?.name ?? t('budgets.category')}</Text>
                  <Text style={{ color: isNearLimit ? colors.destructive : colors.mutedForeground, fontSize: 13 }}>
                    {formatCurrency(spent, currency)} / {formatCurrency(Number(b.amount), currency)}
                  </Text>
                </View>
                <ProgressBar progress={progress} showLabel />
              </Card>
            );
          })
        ) : (
          <EmptyState title={t('budgets.empty')} subtitle={t('budgets.emptySub')} icon="pie-chart-outline" />
        )}

        <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 12 }}>{t('profile.savingsGoals')}</Text>
        {loadingGoals ? (
          <ActivityIndicator color={colors.primary} />
        ) : goals?.length ? (
          goals.map((g) => {
            const progress = (Number(g.current_amount) / Number(g.target_amount)) * 100;
            return (
              <Card key={g.id} style={{ marginBottom: 10 }}>
                <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 16, marginBottom: 4 }}>{g.name}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
                  {t('budgets.ofAmount', {
                    current: formatCurrency(Number(g.current_amount), currency),
                    target: formatCurrency(Number(g.target_amount), currency),
                  })}
                </Text>
                <ProgressBar progress={progress} color={colors.primary} showLabel />
              </Card>
            );
          })
        ) : (
          <EmptyState title={t('budgets.noGoals')} subtitle={t('budgets.noGoalsSub')} icon="flag-outline" />
        )}
      </ScreenContainer>
    </View>
  );
}
