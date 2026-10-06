import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { formatCurrency, formatDate, isIncomeType, INCOME_COLOR } from '@/src/core/utils/format';
import { getCategoryIcon } from '@/src/core/constants/categories';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';
import type { Transaction } from '@/src/core/types/entities';

interface TransactionRowProps {
  transaction: Transaction;
  currency?: string;
  onPress?: () => void;
  compact?: boolean;
  /** e.g. "Otro mes · marzo 2026" when searching across months */
  otherMonthLabel?: string | null;
}

/** MonAi-style transaction row: icon · category · title · amount pill */
export function TransactionRow({
  transaction,
  currency = 'MXN',
  onPress,
  compact,
  otherMonthLabel,
}: TransactionRowProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const isIncome = isIncomeType(transaction.type);
  const sign = isIncome ? '+' : '-';
  const amountColor = isIncome ? INCOME_COLOR : colors.foreground;
  const catColor = transaction.category?.color ?? colors.primary;

  const title =
    transaction.description?.trim() ||
    transaction.merchant?.trim() ||
    transaction.category?.name ||
    t('transactions.movementFallback');

  const categoryLabel = transaction.category?.name ?? (isIncome ? t('common.income') : t('common.expense'));

  const content = (
    <>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: `${catColor}22`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={getCategoryIcon(transaction.category?.icon)} size={22} color={catColor} />
      </View>

      <View style={{ flex: 1, marginRight: 10, minWidth: 0 }}>
        <AppText
          style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: Font.medium }}
          numberOfLines={1}
        >
          {categoryLabel}
        </AppText>
        <AppText
          style={{ color: colors.foreground, fontFamily: Font.semibold, fontSize: 17, marginTop: 2 }}
          numberOfLines={1}
        >
          {title}
        </AppText>
        {!compact ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 980,
                backgroundColor: colors.fill,
              }}
            >
              <AppText style={{ color: colors.mutedForeground, fontSize: 12 }} numberOfLines={1}>
                {formatDate(transaction.transaction_date, 'd MMM')}
                {transaction.account?.name ? ` · ${transaction.account.name}` : ''}
                {transaction.tags?.includes('source:whatsapp') ? ` · ${t('transactions.viaWhatsapp')}` : ''}
              </AppText>
            </View>
            {otherMonthLabel ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 980,
                  backgroundColor: colors.accent,
                }}
              >
                <AppText style={{ color: colors.accentForeground, fontSize: 12, fontFamily: Font.medium }} numberOfLines={1}>
                  {otherMonthLabel}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : otherMonthLabel ? (
          <AppText style={{ color: colors.primary, fontSize: 11, fontFamily: Font.medium, marginTop: 4 }} numberOfLines={1}>
            {otherMonthLabel}
          </AppText>
        ) : null}
      </View>

      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 980,
          backgroundColor: colors.fill,
        }}
      >
        <AppText
          style={{
            color: amountColor,
            fontFamily: Font.bold,
            fontSize: 15,
            letterSpacing: -0.2,
          }}
          numberOfLines={1}
        >
          {sign} {formatCurrency(Number(transaction.amount), currency)}
        </AppText>
      </View>
    </>
  );

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: compact ? 12 : 14,
    paddingHorizontal: 4,
    minHeight: 72,
  };

  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.99} style={rowStyle}>
        {content}
      </PressableScale>
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
