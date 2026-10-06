import React from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { FormHero, FormSection } from '@/src/components/ui/FormChrome';
import { PressableScale } from '@/src/components/ui/Glass';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { AppText, Font } from '@/src/components/ui/AppText';
import { MoneyDisplay } from '@/src/components/ui/MoneyDisplay';
import { useAuth } from '@/src/providers/AuthProvider';
import { getMonthYear } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';
import { getCategoryIcon } from '@/src/core/constants/categories';

export default function CreateBudgetScreen() {
  const { profile } = useAuth();
  const { colors, radius, isDark } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const { month, year } = getMonthYear();
  const { data: categories } = useCategories('expense');
  const createBudget = useCreateBudget();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetInput>,
    defaultValues: { amount: 0, month, year, alert_threshold: 80, category_id: '' },
  });

  const selectedCategory = watch('category_id');
  const amountValue = watch('amount');

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
        <FormHero icon="pie-chart" title={t('budgets.newBudget')} subtitle={t('budgets.emptySub')} />

        <AnimatedIn>
          <FormSection label={t('budgets.category')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {categories?.map((cat) => {
                const selected = selectedCategory === cat.id;
                return (
                  <PressableScale
                    key={cat.id}
                    onPress={() => setValue('category_id', cat.id, { shouldValidate: true })}
                    scaleTo={0.96}
                    style={{
                      width: '30%',
                      flexGrow: 1,
                      maxWidth: '32%',
                      minWidth: 96,
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 8,
                      borderRadius: radius,
                      backgroundColor: selected ? `${cat.color}22` : colors.fill,
                      borderWidth: selected ? 1.5 : 0,
                      borderColor: cat.color,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colors.card,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                        shadowColor: '#000',
                        shadowOpacity: isDark ? 0.2 : 0.05,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
                      }}
                    >
                      <Ionicons name={getCategoryIcon(cat.icon)} size={20} color={cat.color} />
                    </View>
                    <AppText
                      style={{
                        fontSize: 12,
                        fontFamily: selected ? Font.bold : Font.medium,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {cat.name}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
            <Controller control={control} name="category_id" render={() => <></>} />
            {errors.category_id ? (
              <AppText style={{ color: colors.destructive, marginTop: 8, fontSize: 13 }}>
                {errors.category_id.message}
              </AppText>
            ) : null}
          </FormSection>
        </AnimatedIn>

        <AnimatedIn delay={60}>
          <FormSection>
            <MoneyDisplay
              amount={Number(amountValue) || 0}
              currency={currency}
              tone="primary"
              size="xl"
              label={t('budgets.monthlyLimit')}
              style={{ marginBottom: 14 }}
            />
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('common.amount')}
                  value={value ? String(value) : ''}
                  onChangeText={(v) => onChange(parseFloat(v) || 0)}
                  keyboardType="decimal-pad"
                  error={errors.amount?.message}
                  style={{ fontSize: 22, fontFamily: Font.bold, textAlign: 'center' }}
                />
              )}
            />
            <Controller
              control={control}
              name="alert_threshold"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('budgets.alertAt')}
                  value={String(value)}
                  onChangeText={(v) => onChange(parseFloat(v) || 80)}
                  keyboardType="number-pad"
                />
              )}
            />
          </FormSection>

          <PrimarySaveButton
            title={t('budgets.createBudget')}
            icon="checkmark-circle"
            onPress={handleSubmit(onSubmit)}
            loading={createBudget.isPending}
          />
        </AnimatedIn>
      </ScreenContainer>
    </View>
  );
}
