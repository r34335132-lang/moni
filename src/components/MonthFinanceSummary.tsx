import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { formatCurrency } from '@/src/core/utils/format';

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
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const balance = income - expenses;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
        {t('dashboard.monthSummary')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#ECFDF5',
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: '#86EFAC',
          }}
        >
          <Text style={{ color: '#166534', fontSize: 12, fontWeight: '600' }}>{t('dashboard.income')}</Text>
          <Text style={{ color: '#15803D', fontSize: 18, fontWeight: '800', marginTop: 4 }}>
            +{formatCurrency(income, currency)}
          </Text>
          {incomeCount !== undefined ? (
            <Text style={{ color: '#166534', fontSize: 11, marginTop: 2 }}>{t('dashboard.movementsCount', { count: incomeCount })}</Text>
          ) : null}
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: '#FEF2F2',
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: '#FECACA',
          }}
        >
          <Text style={{ color: '#991B1B', fontSize: 12, fontWeight: '600' }}>{t('dashboard.expenses')}</Text>
          <Text style={{ color: '#DC2626', fontSize: 18, fontWeight: '800', marginTop: 4 }}>
            -{formatCurrency(expenses, currency)}
          </Text>
          {expenseCount !== undefined ? (
            <Text style={{ color: '#991B1B', fontSize: 11, marginTop: 2 }}>{t('dashboard.movementsCount', { count: expenseCount })}</Text>
          ) : null}
        </View>
      </View>
      <View
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t('dashboard.monthBalance')}</Text>
        <Text
          style={{
            color: balance >= 0 ? '#15803D' : '#DC2626',
            fontSize: 16,
            fontWeight: '800',
          }}
        >
          {balance >= 0 ? '+' : ''}{formatCurrency(balance, currency)}
        </Text>
      </View>
    </View>
  );
}
