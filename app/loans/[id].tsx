import React, { useEffect, useState } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLoan, useLoanPayments, useAddLoanPayment } from '@/src/hooks/useLoans';
import { useMoneyLentItem, useMoneyLentPayments, useAddMoneyLentPayment } from '@/src/hooks/useMoneyLent';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card, SectionLabel } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { FormSection, FormChip } from '@/src/components/ui/FormChrome';
import { AppText, Font } from '@/src/components/ui/AppText';
import { MoneyDisplay } from '@/src/components/ui/MoneyDisplay';
import { formatDate, roundMoney, parseAmount } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';

export default function LoanDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const isBorrowed = type === 'borrowed';

  const { data: loan, isLoading: loadingLoan } = useLoan(isBorrowed ? id : '');
  const { data: loanPayments } = useLoanPayments(isBorrowed ? id : '');
  const { data: moneyLent, isLoading: loadingLent } = useMoneyLentItem(!isBorrowed ? id : '');
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
  const original = Number((isBorrowed ? loan?.amount : moneyLent?.amount) ?? 0);
  const remaining = Number(
    (isBorrowed ? loan?.remaining_balance : moneyLent?.remaining_balance) ?? 0,
  );
  const paid = Math.max(0, original - remaining);
  const progress = original > 0 ? (paid / original) * 100 : 0;
  const notes = isBorrowed ? loan?.notes : moneyLent?.concept;
  const payPreview = parseAmount(payAmount) ?? 0;

  useEffect(() => {
    if (!accounts?.length) return;
    if (paymentAccountId && accounts.some((account) => account.id === paymentAccountId)) return;

    const preferredId =
      item?.account_id ?? accounts.find((account) => account.is_default)?.id ?? accounts[0]?.id ?? '';
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

  if (loadingLoan || loadingLent) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!item) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={title ?? t('common.detail')} showBack />
      <ScreenContainer>
        <Card style={{ marginBottom: 18 }} padding={16}>
          <MoneyDisplay
            amount={remaining}
            currency={currency}
            tone={isBorrowed ? 'expense' : 'income'}
            size="xl"
            label={t('loans.remaining')}
          />
          <View style={{ marginTop: 12 }}>
            <ProgressBar progress={progress} showLabel />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <MoneyDisplay
                amount={paid}
                currency={currency}
                tone="primary"
                size="sm"
                label={`${Math.round(progress)}%`}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <MoneyDisplay
                amount={original}
                currency={currency}
                tone="neutral"
                size="sm"
                label={t('common.total')}
              />
            </View>
          </View>
          {notes ? (
            <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 12, textAlign: 'center' }}>
              {t('loans.note')}: {notes}
            </AppText>
          ) : null}
        </Card>

        <SectionLabel>{t('loans.registerPayment')}</SectionLabel>
        <FormSection>
          <MoneyDisplay
            amount={payPreview}
            currency={currency}
            tone={isBorrowed ? 'expense' : 'income'}
            size="lg"
            label={t('common.amount')}
            style={{ marginBottom: 12 }}
          />
          <Input
            label={t('common.amount')}
            value={payAmount}
            onChangeText={setPayAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <Input
            label={t('common.noteOptional')}
            value={payNote}
            onChangeText={setPayNote}
            placeholder={t('loans.paymentNotePlaceholder')}
          />
          <AppText style={{ color: colors.mutedForeground, fontFamily: Font.semibold, fontSize: 13, marginBottom: 10 }}>
            {isBorrowed ? t('loans.payFromAccount') : t('loans.collectIntoAccount')}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {accounts?.map((account) => (
              <FormChip
                key={account.id}
                label={account.name}
                selected={paymentAccountId === account.id}
                onPress={() => setPaymentAccountId(account.id)}
                icon="wallet-outline"
              />
            ))}
          </View>
        </FormSection>

        <PrimarySaveButton
          title={t('loans.registerPayment')}
          icon="checkmark-circle"
          onPress={handlePayment}
          loading={addLoanPayment.isPending || addLentPayment.isPending}
          style={{ marginBottom: 24 }}
        />

        <SectionLabel>{t('loans.paymentHistory')}</SectionLabel>
        {payments?.length ? (
          payments.map((p) => (
            <Card key={p.id} style={{ marginBottom: 8 }} padding={14}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <MoneyDisplay
                    amount={Number(p.amount)}
                    currency={currency}
                    tone={isBorrowed ? 'expense' : 'income'}
                    size="sm"
                    staged={false}
                    align="left"
                  />
                </View>
                <AppText style={{ color: colors.mutedForeground, fontSize: 13 }}>
                  {formatDate(p.payment_date, 'd MMM yyyy')}
                </AppText>
              </View>
              {p.account?.name ? (
                <AppText style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                  {(isBorrowed ? t('loans.paidFrom') : t('loans.collectedInto'))}: {p.account.name}
                </AppText>
              ) : null}
              {p.notes ? (
                <AppText style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>{p.notes}</AppText>
              ) : null}
            </Card>
          ))
        ) : (
          <AppText style={{ color: colors.mutedForeground, textAlign: 'center', padding: 16 }}>
            {t('loans.noPaymentsYet')}
          </AppText>
        )}
      </ScreenContainer>
    </View>
  );
}
