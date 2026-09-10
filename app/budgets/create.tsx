import React from 'react';
import { View, Alert, Pressable, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { budgetSchema, type BudgetInput } from '@/src/core/validation/schemas';
import { useCreateBudget } from '@/src/hooks/useBudgets';
import { useCategories } from '@/src/hooks/useCategories';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { getMonthYear } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';

export default function CreateBudgetScreen() {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const { month, year } = getMonthYear();
  const { data: categories } = useCategories('expense');
  const createBudget = useCreateBudget();

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetInput>,
    defaultValues: { amount: 0, month, year, alert_threshold: 80, category_id: '' },
  });

  const selectedCategory = watch('category_id');

  const onSubmit = async (data: BudgetInput) => {
    try {
      await createBudget.mutateAsync(data);
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('budgets.newBudget')} showBack />
      <ScreenContainer>
        <Text style={{ color: colors.foreground, fontWeight: '500', marginBottom: 8 }}>{t('budgets.category')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {categories?.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setValue('category_id', cat.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: radius,
                marginRight: 8,
                backgroundColor: selectedCategory === cat.id ? `${cat.color}30` : colors.secondary,
                borderWidth: 1,
                borderColor: selectedCategory === cat.id ? cat.color : colors.border,
              }}
            >
              <Text style={{ color: colors.foreground }}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Controller control={control} name="category_id" render={() => <></>} />
        {errors.category_id && <Text style={{ color: colors.destructive, marginBottom: 8 }}>{errors.category_id.message}</Text>}

        <Controller control={control} name="amount" render={({ field: { onChange, value } }) => (
          <Input label={t('budgets.monthlyLimit')} value={value ? String(value) : ''} onChangeText={(v) => onChange(parseFloat(v) || 0)} keyboardType="decimal-pad" error={errors.amount?.message} />
        )} />
        <Controller control={control} name="alert_threshold" render={({ field: { onChange, value } }) => (
          <Input label={t('budgets.alertAt')} value={String(value)} onChangeText={(v) => onChange(parseFloat(v) || 80)} keyboardType="number-pad" />
        )} />
        <Button title={t('budgets.createBudget')} onPress={handleSubmit(onSubmit)} loading={createBudget.isPending} />
      </ScreenContainer>
    </View>
  );
}
