import React, { useCallback, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useBeneficiary, useBeneficiaryTransactions } from '@/src/hooks/useBeneficiaries';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { TransactionRow, groupTransactionsByDate } from '@/src/components/TransactionRow';
import { formatCurrency, isExpenseType, isIncomeType, INCOME_COLOR, EXPENSE_COLOR } from '@/src/core/utils/format';

const RELATIONSHIP_STORAGE: Record<string, string> = {
  'Hijo/a': 'child',
  Familiar: 'family',
  Pareja: 'partner',
  'Amigo/a': 'friend',
  Otro: 'other',
};

export default function BeneficiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const beneficiaryId = Array.isArray(id) ? id[0] : id;
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const { data: beneficiary, isLoading, refetch: refetchBen } = useBeneficiary(beneficiaryId);
  const { data: rawTransactions, isLoading: loadingTx, refetch: refetchTx } = useBeneficiaryTransactions(
    beneficiaryId,
    beneficiary?.name,
  );

  useFocusEffect(
    useCallback(() => {
      refetchBen();
      refetchTx();
    }, [refetchBen, refetchTx]),
  );

  const transactions = useMemo(
    () => (rawTransactions ?? []).filter((tx) => !tx.deleted_at),
    [rawTransactions],
  );
  const groups = groupTransactionsByDate(transactions);

  const totalDelivered = useMemo(
    () => transactions.filter((tx) => isExpenseType(tx.type)).reduce((s, tx) => s + Number(tx.amount), 0),
    [transactions],
  );

  if (isLoading && !beneficiary) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!beneficiary) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t('beneficiaries.detail')} showBack />
        <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 32 }}>
          {t('beneficiaries.notFound')}
        </Text>
      </View>
    );
  }

  const relKey = RELATIONSHIP_STORAGE[beneficiary.relationship];
  const subtitle = relKey ? t(`beneficiaries.${relKey}`) : beneficiary.relationship;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={beneficiary.name} showBack subtitle={subtitle} />
      <ScreenContainer>
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t('beneficiaries.totalDelivered')}</Text>
          <Text style={{ color: EXPENSE_COLOR, fontSize: 28, fontWeight: '800', marginTop: 4 }}>
            {formatCurrency(totalDelivered, currency)}
          </Text>
          {beneficiary.notes ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 8 }}>{beneficiary.notes}</Text>
          ) : null}
        </Card>

        <Text style={{ color: colors.foreground, fontWeight: '700', marginBottom: 12 }}>{t('common.history')}</Text>
        {loadingTx && !transactions.length ? (
          <ActivityIndicator color={colors.primary} />
        ) : groups.length ? (
          groups.map((group) => (
            <View key={group.label} style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.mutedForeground, fontWeight: '600', marginBottom: 8, textTransform: 'capitalize' }}>
                {group.label}
              </Text>
              {group.data.map((tx) => (
                <View key={tx.id} style={{ marginBottom: 8 }}>
                  <TransactionRow transaction={tx} currency={currency} compact />
                  <Text
                    style={{
                      color: isIncomeType(tx.type) ? INCOME_COLOR : EXPENSE_COLOR,
                      fontSize: 11,
                      fontWeight: '600',
                      paddingHorizontal: 16,
                    }}
                  >
                    {isIncomeType(tx.type) ? t('common.income') : t('common.expense')}
                    {tx.category?.name ? ` · ${tx.category.name}` : ''}
                    {tx.description ? ` · ${tx.description}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          ))
        ) : (
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 24 }}>
            {t('beneficiaries.noLinkedMovements')}
          </Text>
        )}
      </ScreenContainer>
    </View>
  );
}
