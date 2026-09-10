import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { moneyLentSchema, type MoneyLentInput } from '@/src/core/validation/schemas';
import { useCreateMoneyLent } from '@/src/hooks/useMoneyLent';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { DatePickerField } from '@/src/components/ui/DatePickerField';
import { getErrorMessage } from '@/src/core/utils/errors';
import { parseAmount } from '@/src/core/utils/format';

export default function CreateLentMoneyScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const createLent = useCreateMoneyLent();
  const [lentDate, setLentDate] = useState(new Date());
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<MoneyLentInput>({
    resolver: zodResolver(moneyLentSchema),
    defaultValues: { debtor_name: '', amount: 0, lent_date: new Date().toISOString().split('T')[0], concept: '', notes: '' },
  });

  const onSubmit = async (data: MoneyLentInput) => {
    try {
      const concept = [data.concept, data.notes].filter(Boolean).join(' — ') || undefined;
      await createLent.mutateAsync({ ...data, concept, notes: undefined });
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('loans.createLentTitle')} showBack />
      <ScreenContainer>
        <Controller control={control} name="debtor_name" render={({ field: { onChange, value } }) => (
          <Input label={t('loans.debtorName')} value={value} onChangeText={onChange} error={errors.debtor_name?.message} />
        )} />
        <Controller control={control} name="amount" render={({ field: { onChange, value } }) => (
          <Input label={t('common.amount')} value={value ? String(value) : ''} onChangeText={(v) => onChange(parseAmount(v) ?? 0)} keyboardType="decimal-pad" error={errors.amount?.message} />
        )} />
        <DatePickerField
          label={t('loans.lentDate')}
          value={lentDate}
          maximumDate={new Date()}
          onChange={(date) => {
            setLentDate(date);
            setValue('lent_date', date.toISOString().split('T')[0]);
          }}
        />
        <Controller control={control} name="concept" render={({ field: { onChange, value } }) => (
          <Input label={t('loans.concept')} value={value ?? ''} onChangeText={onChange} placeholder={t('loans.conceptPlaceholder')} />
        )} />
        <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
          <Input label={t('common.noteOptional')} value={value ?? ''} onChangeText={onChange} placeholder={t('loans.notesPlaceholder')} multiline />
        )} />
        <Button title={t('loans.register')} onPress={handleSubmit(onSubmit)} loading={createLent.isPending} />
      </ScreenContainer>
    </View>
  );
}
