import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLoan, useLoanPayments, useAddLoanPayment } from '@/src/hooks/useLoans';
import { useMoneyLentItem, useMoneyLentPayments, useAddMoneyLentPayment } from '@/src/hooks/useMoneyLent';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { formatCurrency, formatDate, roundMoney, parseAmount } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';

export default function LoanDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const isBorrowed = type === 'borrowed';

  const { data: loan } = useLoan(isBorrowed ? id : '');
  const { data: loanPayments } = useLoanPayments(isBorrowed ? id : '');
  const { data: moneyLent } = useMoneyLentItem(!isBorrowed ? id : '');
  const { data: lentPayments } = useMoneyLentPayments(!isBorrowed ? id : '');
  const { data: accounts } = useAccounts();

  const addLoanPayment = useAddLoanPayment();
  const addLentPayment = useAddMoneyLentPayment();
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');

  const item = isBorrowed ? loan : moneyLent;
  const payments = isBorrowed ? loanPayments : lentPayments;
  const title = isBorrowed ? loan?.lender : moneyLent?.debtor_name;
  const original = Number(item?.amount ?? 0);
  const remaining = Number(isBorrowed ? loan?.remaining_balance : moneyLent?.remaining_balance ?? 0);
  const paid = original - remaining;
  const progress = original > 0 ? (paid / original) * 100 : 0;
  const notes = isBorrowed ? loan?.notes : moneyLent?.concept;

  useEffect(() => {
    if (!accounts?.length) return;
    if (paymentAccountId && accounts.some((account) => account.id === paymentAccountId)) return;

    const preferredId = item?.account_id ?? accounts.find((account) => account.is_default)?.id ?? accounts[0]?.id ?? '';
    if (preferredId) setPaymentAccountId(preferredId);
  }, [accounts, item?.account_id, paymentAccountId]);

  const handlePayment = async () => {
    const amount = parseAmount(payAmount);
    if (!amount || amount <= 0) {
      Alert.alert(t('loans.invalidAmount'));
      return;
    }
    if (!paymentAccountId) {
      Alert.alert(t('common.error'), t('loans.selectAccount'));
      return;
    }
    try {
      if (isBorrowed) {
        await addLoanPayment.mutateAsync({
          loanId: id,
          amount: roundMoney(amount),
          date: new Date().toISOString().split('T')[0],
          accountId: paymentAccountId,
          notes: payNote.trim() || undefined,
        });
      } else {
        await addLentPayment.mutateAsync({
          id,
          amount: roundMoney(amount),
          date: new Date().toISOString().split('T')[0],
          accountId: paymentAccountId,
          notes: payNote.trim() || undefined,
        });
      }
      setPayAmount('');
      setPayNote('');
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  if (!item) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={title ?? t('common.detail')} showBack />
      <ScreenContainer>
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t('loans.remaining')}</Text>
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: '700', marginVertical: 4 }} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(remaining, currency)}
          </Text>
          <ProgressBar progress={progress} showLabel />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '600' }}>
              {t('loans.paidLabel', { amount: formatCurrency(paid, currency), percent: Math.round(progress) })}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              {t('common.total')}: {formatCurrency(original, currency)}
            </Text>
          </View>
          {notes ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 10, fontStyle: 'italic' }}>
              {t('loans.note')}: {notes}
            </Text>
          ) : null}
        </Card>

        <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 8 }}>{t('loans.registerPayment')}</Text>
        <Input label={t('common.amount')} value={payAmount} onChangeText={setPayAmount} keyboardType="decimal-pad" placeholder="0.00" />
        <Input label={t('common.noteOptional')} value={payNote} onChangeText={setPayNote} placeholder={t('loans.paymentNotePlaceholder')} />
        <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 8 }}>
          {isBorrowed ? t('loans.payFromAccount') : t('loans.collectIntoAccount')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {accounts?.map((account) => (
            <Pressable
              key={account.id}
              onPress={() => setPaymentAccountId(account.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: paymentAccountId === account.id ? colors.primary : colors.secondary,
                borderWidth: 1,
                borderColor: paymentAccountId === account.id ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: paymentAccountId === account.id ? colors.primaryForeground : colors.foreground, fontWeight: '600' }}>
                {account.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button title={t('loans.registerPayment')} onPress={handlePayment} loading={addLoanPayment.isPending || addLentPayment.isPending} style={{ marginBottom: 24 }} />

        <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 12 }}>{t('loans.paymentHistory')}</Text>
        {payments?.length ? (
          payments.map((p) => (
            <Card key={p.id} style={{ marginBottom: 8, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>
                  {formatCurrency(Number(p.amount), currency)}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{formatDate(p.payment_date, 'd MMM yyyy')}</Text>
              </View>
              {p.account?.name ? (
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                  {(isBorrowed ? t('loans.paidFrom') : t('loans.collectedInto'))}: {p.account.name}
                </Text>
              ) : null}
              {p.notes ? (
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>{p.notes}</Text>
              ) : null}
            </Card>
          ))
        ) : (
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 16 }}>{t('loans.noPaymentsYet')}</Text>
        )}
      </ScreenContainer>
    </View>
  );
}
