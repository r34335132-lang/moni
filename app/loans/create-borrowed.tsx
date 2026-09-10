import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { loanSchema, type LoanInput } from '@/src/core/validation/schemas';
import { useCreateLoan } from '@/src/hooks/useLoans';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { DatePickerField } from '@/src/components/ui/DatePickerField';
import { getErrorMessage } from '@/src/core/utils/errors';
import { parseAmount } from '@/src/core/utils/format';

export default function CreateBorrowedLoanScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const createLoan = useCreateLoan();
  const [dueDate, setDueDate] = useState(new Date());
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<LoanInput>({
    resolver: zodResolver(loanSchema) as Resolver<LoanInput>,
    defaultValues: { amount: 0, lender: '', interest_rate: 0, notes: '' },
  });

  const onSubmit = async (data: LoanInput) => {
    try {
      await createLoan.mutateAsync(data);
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('loans.createBorrowedTitle')} showBack />
      <ScreenContainer>
        <Controller control={control} name="amount" render={({ field: { onChange, value } }) => (
          <Input label={t('common.amount')} value={value ? String(value) : ''} onChangeText={(v) => onChange(parseAmount(v) ?? 0)} keyboardType="decimal-pad" error={errors.amount?.message} />
        )} />
        <Controller control={control} name="lender" render={({ field: { onChange, value } }) => (
          <Input label={t('loans.lender')} value={value} onChangeText={onChange} error={errors.lender?.message} />
        )} />
        <Controller control={control} name="interest_rate" render={({ field: { onChange, value } }) => (
          <Input label={t('loans.interest')} value={value ? String(value) : ''} onChangeText={(v) => onChange(parseAmount(v) ?? 0)} keyboardType="decimal-pad" />
        )} />
        <Controller control={control} name="monthly_payment" render={({ field: { onChange, value } }) => (
          <Input label={t('loans.monthlyPayment')} value={value ? String(value) : ''} onChangeText={(v) => onChange(parseAmount(v))} keyboardType="decimal-pad" />
        )} />
        <DatePickerField
          label={t('loans.dueDate')}
          value={dueDate}
          minimumDate={new Date()}
          onChange={(date) => {
            setDueDate(date);
            setValue('due_date', date.toISOString().split('T')[0]);
          }}
        />
        <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
          <Input label={t('loans.notes')} value={value ?? ''} onChangeText={onChange} multiline />
        )} />
        <Button title={t('loans.registerLoan')} onPress={handleSubmit(onSubmit)} loading={createLoan.isPending} />
      </ScreenContainer>
    </View>
  );
}
