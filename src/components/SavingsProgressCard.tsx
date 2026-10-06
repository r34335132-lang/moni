import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { AppText, Font } from '@/src/components/ui/AppText';
import { MoneyDisplay } from '@/src/components/ui/MoneyDisplay';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { PressableScale } from '@/src/components/ui/Glass';
import { formatCurrency, formatPercent } from '@/src/core/utils/format';

interface SavingsProgressCardProps {
  saved: number;
  target: number;
  progress: number;
  goalsCount: number;
  currency: string;
}

export function SavingsProgressCard({
  saved,
  target,
  progress,
  goalsCount,
  currency,
}: SavingsProgressCardProps) {
  const { colors, radius, isDark } = useTheme();
  const { t } = useLanguage();
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : Math.min(100, progress);

  return (
    <PressableScale
      onPress={() => router.push(goalsCount ? '/savings-goals' : '/savings-goals/create')}
      style={{
        backgroundColor: colors.card,
        borderRadius: radius,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.28 : 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="leaf-outline" size={18} color={colors.primary} />
          </View>
          <AppText style={{ fontFamily: Font.bold, fontSize: 17 }}>{t('dashboard.savingsTitle')}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </View>

      {goalsCount === 0 ? (
        <AppText style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>
          {t('dashboard.savingsEmpty')}
        </AppText>
      ) : (
        <>
          <AppText variant="caption" style={{ color: colors.mutedForeground, marginBottom: 4 }}>
            {t('dashboard.savingsSaved')}
          </AppText>
          <MoneyDisplay amount={saved} currency={currency} tone="income" size="lg" align="left" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 8 }}>
            <AppText style={{ color: colors.mutedForeground, fontSize: 12 }}>
              {t('dashboard.savingsOfTarget', { percent: formatPercent(pct) })}
            </AppText>
            <AppText style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: Font.medium }}>
              {t('dashboard.savingsGoalsCount', { count: goalsCount })}
            </AppText>
          </View>
          <ProgressBar progress={pct} height={9} color={colors.primary} />
          {target > 0 ? (
            <AppText style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 10 }}>
              {t('dashboard.savingsTargetLabel')}: {formatCurrency(target, currency)}
            </AppText>
          ) : null}
        </>
      )}
    </PressableScale>
  );
}
