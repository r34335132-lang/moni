import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { AppText, Font } from '@/src/components/ui/AppText';
import { MoneyDisplay } from '@/src/components/ui/MoneyDisplay';

interface MonthFinanceSummaryProps {
  income: number;
  expenses: number;
  currency?: string;
  incomeCount?: number;
  expenseCount?: number;
}

export function MonthFinanceSummary({
  income,
  expenses,
  currency = 'MXN',
  incomeCount,
  expenseCount,
}: MonthFinanceSummaryProps) {
  const { colors, radius, isDark } = useTheme();
  const { t } = useLanguage();
  const balance = income - expenses;

  return (
    <View
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
      <AppText
        variant="label"
        style={{ color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 12 }}
      >
        {t('dashboard.monthSummary')}
      </AppText>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="caption" style={{ color: colors.mutedForeground, fontFamily: Font.medium, marginBottom: 6 }}>
            {t('dashboard.income')}
            {incomeCount !== undefined ? ` · ${incomeCount}` : ''}
          </AppText>
          <MoneyDisplay amount={income} currency={currency} tone="income" size="md" align="left" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="caption" style={{ color: colors.mutedForeground, fontFamily: Font.medium, marginBottom: 6 }}>
            {t('dashboard.expenses')}
            {expenseCount !== undefined ? ` · ${expenseCount}` : ''}
          </AppText>
          <MoneyDisplay amount={expenses} currency={currency} tone="expense" size="md" align="left" />
        </View>
      </View>

      <View
        style={{
          paddingTop: 14,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.separator,
        }}
      >
        <MoneyDisplay
          amount={balance}
          currency={currency}
          tone={balance >= 0 ? 'income' : 'expense'}
          size="lg"
          label={t('dashboard.monthBalance')}
        />
      </View>
    </View>
  );
}
