import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSavingGoals } from '@/src/hooks/useSavingGoals';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { EmptyState } from '@/src/components/EmptyState';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';
import { formatCurrency } from '@/src/core/utils/format';

export default function SavingGoalsScreen() {
  const { profile } = useAuth();
  const { colors, radiusPill } = useTheme();
  const { t } = useLanguage();
  const { data: goals, isLoading } = useSavingGoals();
  const currency = profile?.currency ?? 'MXN';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('savingsGoals.title')} showBack subtitle={t('savingsGoals.emptySub')} />
      <ScreenContainer>
        <AnimatedIn>
          <PressableScale
            onPress={() => router.push('/savings-goals/create')}
            style={{
              borderRadius: radiusPill,
              backgroundColor: colors.primary,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              marginBottom: 18,
              shadowColor: colors.primary,
              shadowOpacity: 0.28,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Ionicons name="add" size={20} color={colors.primaryForeground} />
            <AppText style={{ fontFamily: Font.semibold, fontSize: 16, color: colors.primaryForeground }}>
              {t('budgets.goalShort')}
            </AppText>
          </PressableScale>
        </AnimatedIn>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : goals?.length ? (
          goals.map((g, index) => {
            const progress = (Number(g.current_amount) / Number(g.target_amount)) * 100;
            return (
              <AnimatedIn key={g.id} index={index}>
                <Card style={{ marginBottom: 12 }} padding={16}>
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
                    <View style={{ flex: 1 }}>
                      <AppText style={{ fontFamily: Font.semibold, fontSize: 17 }}>{g.name}</AppText>
                      <AppText style={{ color: colors.mutedForeground, marginTop: 2, fontSize: 13 }}>
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
          <EmptyState title={t('savingsGoals.empty')} subtitle={t('savingsGoals.emptySub')} />
        )}
      </ScreenContainer>
    </View>
  );
}
