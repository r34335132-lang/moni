import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { savingGoalSchema, type SavingGoalInput } from '@/src/core/validation/schemas';
import { useCreateSavingGoal } from '@/src/hooks/useSavingGoals';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { DatePickerField } from '@/src/components/ui/DatePickerField';
import { getErrorMessage } from '@/src/core/utils/errors';

export default function CreateSavingGoalScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const createGoal = useCreateSavingGoal();
  const [targetDate, setTargetDate] = useState(new Date());
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<SavingGoalInput>({
    resolver: zodResolver(savingGoalSchema) as Resolver<SavingGoalInput>,
    defaultValues: { name: '', target_amount: 0, current_amount: 0 },
  });

  const onSubmit = async (data: SavingGoalInput) => {
    try {
      await createGoal.mutateAsync(data);
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('savingsGoals.new')} showBack />
      <ScreenContainer>
        <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
          <Input label={t('common.name')} value={value} onChangeText={onChange} error={errors.name?.message} />
        )} />
        <Controller control={control} name="target_amount" render={({ field: { onChange, value } }) => (
          <Input label={t('savingsGoals.target')} value={value ? String(value) : ''} onChangeText={(v) => onChange(parseFloat(v) || 0)} keyboardType="decimal-pad" error={errors.target_amount?.message} />
        )} />
        <Controller control={control} name="current_amount" render={({ field: { onChange, value } }) => (
          <Input label={t('savingsGoals.currentAmount')} value={value ? String(value) : ''} onChangeText={(v) => onChange(parseFloat(v) || 0)} keyboardType="decimal-pad" />
        )} />
        <DatePickerField
          label={t('savingsGoals.targetDate')}
          value={targetDate}
          minimumDate={new Date()}
          onChange={(date) => {
            setTargetDate(date);
            setValue('target_date', date.toISOString().split('T')[0]);
          }}
        />
        <Button title={t('savingsGoals.create')} onPress={handleSubmit(onSubmit)} loading={createGoal.isPending} />
      </ScreenContainer>
    </View>
  );
}
