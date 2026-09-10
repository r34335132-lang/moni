import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
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

export default function SavingGoalsScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { data: goals, isLoading } = useSavingGoals();
  const currency = profile?.currency ?? 'MXN';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('savingsGoals.title')} showBack />
      <ScreenContainer>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : goals?.length ? (
          goals.map((g) => {
            const progress = (Number(g.current_amount) / Number(g.target_amount)) * 100;
            return (
              <Card key={g.id} style={{ marginBottom: 12 }}>
                <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 17 }}>{g.name}</Text>
                <Text style={{ color: colors.mutedForeground, marginTop: 4, marginBottom: 10 }}>
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
          <EmptyState title={t('savingsGoals.empty')} subtitle={t('savingsGoals.emptySub')} />
        )}
      </ScreenContainer>
    </View>
  );
}
