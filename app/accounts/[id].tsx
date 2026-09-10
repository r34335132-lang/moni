import React, { useCallback, useMemo } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAccount } from '@/src/hooks/useAccounts';
import { useDeleteTransaction, useTransactions } from '@/src/hooks/useTransactions';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { groupTransactionsByDate } from '@/src/components/TransactionRow';
import { SwipeableTransactionRow } from '@/src/components/SwipeableTransactionRow';
import { formatCurrency, isIncomeType, isExpenseType, INCOME_COLOR, EXPENSE_COLOR } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';

export default function AccountHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accountId = Array.isArray(id) ? id[0] : id;
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const { data: account, isLoading: loadingAcc, refetch: refetchAcc } = useAccount(accountId);
  const { data: rawTransactions, isLoading: loadingTx, refetch: refetchTx } = useTransactions({ accountId });
  const deleteTx = useDeleteTransaction();

  useFocusEffect(
    useCallback(() => {
      refetchAcc();
      refetchTx();
    }, [refetchAcc, refetchTx]),
  );

  const transactions = useMemo(
    () => (rawTransactions ?? []).filter((tx) => !tx.deleted_at),
    [rawTransactions],
  );
  const groups = groupTransactionsByDate(transactions);
  const balance = Number(account?.balance ?? 0);
  const balanceColor = balance < 0 ? EXPENSE_COLOR : INCOME_COLOR;

  if (loadingAcc && !account) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!account) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={account.name} showBack subtitle={t('accounts.movementHistory')} />
      <ScreenContainer>
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t('accounts.currentBalance')}</Text>
          <Text style={{ color: balanceColor, fontSize: 26, fontWeight: '800', marginTop: 4 }}>
            {formatCurrency(balance, currency)}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>
            {t('accounts.registeredCount', { count: transactions.length })}
          </Text>
        </Card>

        {loadingTx && !transactions.length ? (
          <ActivityIndicator color={colors.primary} />
        ) : groups.length ? (
          groups.map((group) => (
            <View key={group.label} style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.mutedForeground, fontWeight: '600', marginBottom: 8, textTransform: 'capitalize' }}>
                {group.label}
              </Text>
              {group.data.map((tx) => {
                const isIncome = isIncomeType(tx.type);
                const note = tx.description?.trim() || tx.merchant?.trim();
                return (
                  <View key={tx.id} style={{ marginBottom: 8 }}>
                    <SwipeableTransactionRow
                      transaction={tx}
                      currency={currency}
                      onEdit={() => router.push(`/transaction/add-manual?id=${tx.id}`)}
                      onDelete={() =>
                        deleteTx.mutate(tx.id, {
                          onError: (e) => Alert.alert(t('dashboard.deleteFailed'), getErrorMessage(e)),
                        })
                      }
                    />
                    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                      <Text style={{ color: isIncome ? INCOME_COLOR : EXPENSE_COLOR, fontSize: 11, fontWeight: '600' }}>
                        {isIncome ? t('common.income') : isExpenseType(tx.type) ? t('common.expense') : tx.type}
                        {tx.category?.name ? ` · ${tx.category.name}` : ''}
                        {note ? ` · ${note}` : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        ) : (
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 32 }}>
            {t('accounts.noMovements')}
          </Text>
        )}
      </ScreenContainer>
    </View>
  );
}
