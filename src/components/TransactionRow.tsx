import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { formatCurrency, formatDate, isIncomeType, INCOME_COLOR, EXPENSE_COLOR } from '@/src/core/utils/format';
import { getCategoryIcon } from '@/src/core/constants/categories';
import type { Transaction } from '@/src/core/types/entities';

interface TransactionRowProps {
  transaction: Transaction;
  currency?: string;
  onPress?: () => void;
  compact?: boolean;
}

export function TransactionRow({ transaction, currency = 'MXN', onPress, compact }: TransactionRowProps) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const isIncome = isIncomeType(transaction.type);
  const sign = isIncome ? '+' : '-';
  const amountColor = isIncome ? INCOME_COLOR : EXPENSE_COLOR;

  const title =
    transaction.description?.trim() ||
    transaction.merchant?.trim() ||
    transaction.category?.name ||
    t('transactions.movementFallback');

  const accountName = transaction.account?.name;
  const typeLabel = isIncome
    ? t('common.income')
    : transaction.type === 'transfer'
      ? t('common.transfer')
      : t('common.expense');

  const subtitleParts = [
    accountName ? `🏦 ${accountName}` : null,
    formatDate(transaction.transaction_date, 'd MMM yyyy'),
    transaction.category?.name,
    typeLabel,
  ].filter(Boolean);

  const content = (
    <>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: transaction.category?.color ? `${transaction.category.color}22` : colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons
          name={getCategoryIcon(transaction.category?.icon)}
          size={20}
          color={transaction.category?.color ?? colors.mutedForeground}
        />
      </View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 3 }} numberOfLines={2}>
          {subtitleParts.join(' · ')}
        </Text>
        {accountName ? (
          <View
            style={{
              alignSelf: 'flex-start',
              marginTop: 5,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: `${colors.primary}18`,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>{accountName}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{ color: amountColor, fontSize: 16, fontWeight: '800' }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {sign}{formatCurrency(Number(transaction.amount), currency)}
        </Text>
        {!compact && transaction.category?.name ? (
          <View
            style={{
              marginTop: 4,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: isIncome ? '#ECFDF5' : '#FEF2F2',
            }}
          >
            <Text style={{ color: isIncome ? INCOME_COLOR : EXPENSE_COLOR, fontSize: 10, fontWeight: '700' }}>
              {transaction.category.name}
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: radius,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [rowStyle, { backgroundColor: pressed ? colors.secondary : colors.card }]}>
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

export function groupTransactionsByDate(
  transactions: Transaction[],
): Array<{ label: string; data: Transaction[] }> {
  const groups: Record<string, Transaction[]> = {};
  transactions.forEach((tx) => {
    const label = formatDate(tx.transaction_date, 'd MMMM yyyy');
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  });
  return Object.entries(groups).map(([label, data]) => ({ label, data }));
}
