import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { AppText, Font } from '@/src/components/ui/AppText';
import { MoneyDisplay } from '@/src/components/ui/MoneyDisplay';
import { PressableScale } from '@/src/components/ui/Glass';
import { EXPENSE_COLOR, INCOME_COLOR, formatCurrency, isExpenseType, isIncomeType } from '@/src/core/utils/format';
import type { Transaction } from '@/src/core/types/entities';

interface DailySummaryCardProps {
  income: number;
  expenses: number;
  count: number;
  currency: string;
  transactions?: Transaction[];
}

export function DailySummaryCard({
  income,
  expenses,
  count,
  currency,
  transactions = [],
}: DailySummaryCardProps) {
  const { colors, radius, isDark } = useTheme();
  const { t } = useLanguage();
  const net = income - expenses;
  const preview = transactions.slice(0, 4);

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
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          </View>
          <AppText style={{ fontFamily: Font.bold, fontSize: 17 }}>{t('dashboard.todaySummary')}</AppText>
        </View>
        <AppText style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: Font.medium }}>
          {t('dashboard.movementsCount', { count })}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="caption" style={{ color: colors.mutedForeground, marginBottom: 4 }}>
            {t('dashboard.todayExpenses')}
          </AppText>
          <MoneyDisplay amount={expenses} currency={currency} tone="expense" size="md" align="left" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="caption" style={{ color: colors.mutedForeground, marginBottom: 4 }}>
            {t('dashboard.todayIncome')}
          </AppText>
          <MoneyDisplay amount={income} currency={currency} tone="income" size="md" align="left" />
        </View>
      </View>

      <View
        style={{
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.separator,
          marginBottom: preview.length ? 10 : 0,
        }}
      >
        <AppText style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 2 }}>
          {t('dashboard.todayNet')}
        </AppText>
        <MoneyDisplay
          amount={net}
          currency={currency}
          tone={net >= 0 ? 'income' : 'expense'}
          size="sm"
          align="left"
        />
      </View>

      {preview.length ? (
        <View style={{ marginTop: 4, gap: 8 }}>
          {preview.map((tx) => {
            const label =
              tx.merchant?.trim() ||
              tx.description?.trim() ||
              tx.category?.name ||
              (isIncomeType(tx.type) ? t('common.income') : t('common.expense'));
            const expense = isExpenseType(tx.type);
            return (
              <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: expense ? EXPENSE_COLOR : INCOME_COLOR,
                  }}
                />
                <AppText style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>
                  {label}
                </AppText>
                <AppText
                  style={{
                    fontFamily: Font.semibold,
                    fontSize: 13,
                    color: expense ? EXPENSE_COLOR : INCOME_COLOR,
                  }}
                >
                  {expense ? '−' : '+'}
                  {formatCurrency(Number(tx.amount), currency)}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : (
        <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 8 }}>
          {t('dashboard.todayEmpty')}
        </AppText>
      )}

      <PressableScale
        onPress={() => router.push('/(tabs)/reminders')}
        style={{
          marginTop: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 10,
          borderRadius: 980,
          backgroundColor: colors.accent,
        }}
      >
        <Ionicons name="notifications-outline" size={16} color={colors.primary} />
        <AppText style={{ fontFamily: Font.semibold, fontSize: 13, color: colors.primary }}>
          {t('dashboard.viewDailySummary')}
        </AppText>
      </PressableScale>
    </View>
  );
}
