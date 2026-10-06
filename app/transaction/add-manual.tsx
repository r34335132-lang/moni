import React, { useState, useEffect, useCallback } from 'react';
import { View, Alert, Image, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { transactionSchema, type TransactionInput } from '@/src/core/validation/schemas';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useCategories } from '@/src/hooks/useCategories';
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction, useTransaction } from '@/src/hooks/useTransactions';
import { useBeneficiaries } from '@/src/hooks/useBeneficiaries';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/providers/AuthProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { getCategoryIcon } from '@/src/core/constants/categories';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Input } from '@/src/components/ui/Input';
import { AmountCalculator } from '@/src/components/ui/AmountCalculator';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { DatePickerField } from '@/src/components/ui/DatePickerField';
import { FormHero, FormSection, FormChip, FormTypeToggle } from '@/src/components/ui/FormChrome';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';
import { formatCurrency } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';
import { transactionService } from '@/src/services/transactionService';

export default function AddManualTransactionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, profile } = useAuth();
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const currency = profile?.currency ?? 'MXN';
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories(type);
  const { data: existing } = useTransaction(id ?? '');
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const { data: beneficiaries } = useBeneficiaries();
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionInput>,
    defaultValues: {
      type: 'expense',
      amount: 0,
      account_id: '',
      category_id: null,
      merchant: '',
      description: '',
      tags: [],
      transaction_date: new Date().toISOString(),
    },
  });

  const amount = watch('amount');
  const accountId = watch('account_id');
  const categoryId = watch('category_id');
  const isSaving = createTx.isPending || updateTx.isPending;
  const saveLabel = id
    ? t('transactionForms.updateMovement')
    : type === 'expense'
      ? t('transactionForms.saveExpense')
      : t('transactionForms.saveIncome');

  useEffect(() => {
    if (accounts?.length && !existing) {
      const defaultAcc = accounts.find((a) => a.is_default) ?? accounts[0];
      setValue('account_id', defaultAcc.id);
    }
  }, [accounts, existing, setValue]);

  useEffect(() => {
    if (categories?.length && !existing) {
      const preferred =
        categories.find((c) => c.name === 'Compras') ??
        categories.find((c) => c.name === 'Supermercado') ??
        categories.find((c) => c.name === 'Comida') ??
        categories.find((c) => c.name === 'Salario') ??
        categories[0];
      if (preferred) setValue('category_id', preferred.id);
    }
  }, [type, categories, existing, setValue]);

  useEffect(() => {
    setValue('type', type);
  }, [type, setValue]);

  useEffect(() => {
    if (existing) {
      setType(existing.type === 'income' ? 'income' : 'expense');
      setValue('type', existing.type as TransactionInput['type']);
      setValue('amount', Number(existing.amount));
      setValue('account_id', existing.account_id);
      setValue('category_id', existing.category_id);
      setValue('merchant', existing.merchant ?? '');
      setValue('description', existing.description ?? '');
      setValue('transaction_date', existing.transaction_date);
      setSelectedDate(new Date(existing.transaction_date));
      setBeneficiaryId(existing.beneficiary_id ?? null);
    }
  }, [existing, setValue]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setValue('transaction_date', date.toISOString());
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const onSubmit = useCallback(
    async (data: TransactionInput) => {
      const payload = { ...data, type, beneficiary_id: type === 'expense' ? beneficiaryId : null };
      try {
        if (id) {
          await updateTx.mutateAsync({ id, input: payload });
          router.back();
          return;
        }

        const tx = await createTx.mutateAsync(payload);
        router.back();

        if (photoUri && user) {
          try {
            const uploaded = await transactionService.uploadPhoto(user.id, photoUri);
            await transactionService.addPhoto(user.id, tx.id, uploaded.path, uploaded.url);
          } catch {
            Alert.alert(t('common.notice'), t('transactionForms.photoAttachFailed'));
          }
        }
      } catch (e) {
        Alert.alert(t('common.error'), getErrorMessage(e));
      }
    },
    [id, type, beneficiaryId, updateTx, createTx, photoUri, user, t],
  );

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(t('smartFill.deleteMovement'), t('smartFill.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTx.mutateAsync(id);
            router.back();
          } catch (e) {
            Alert.alert(t('common.error'), getErrorMessage(e));
          }
        },
      },
    ]);
  };

  const onSave = handleSubmit(onSubmit);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={id ? t('transactionForms.editTitle') : t('transactionForms.addManual')}
        showBack
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: Math.max(insets.bottom, 24) + 40 }}
        keyboardShouldPersistTaps="handled"
        extraKeyboardSpace={Platform.OS === 'ios' ? 40 : 80}
      >
        <FormHero
          icon={type === 'expense' ? 'remove-circle' : 'add-circle'}
          title={id ? t('transactionForms.editTitle') : type === 'expense' ? t('common.expense') : t('common.income')}
          subtitle={t('transactionForms.addManual')}
          tint={type === 'expense' ? colors.destructive : colors.primary}
        />

        <FormTypeToggle
          value={type}
          onChange={(v) => {
            setType(v as 'income' | 'expense');
            setValue('type', v as 'income' | 'expense');
          }}
          leftLabel={t('common.expense')}
          rightLabel={t('common.income')}
        />

        <FormSection>
          <DatePickerField
            label={t('transactionForms.transactionDate')}
            value={selectedDate}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input
                label={
                  type === 'income'
                    ? t('transactionForms.descriptionIncome')
                    : t('transactionForms.descriptionExpense')
                }
                value={value ?? ''}
                onChangeText={onChange}
                placeholder={
                  type === 'income'
                    ? t('transactionForms.descriptionIncomePlaceholder')
                    : t('transactionForms.descriptionExpensePlaceholder')
                }
                multiline
              />
            )}
          />

          {type === 'expense' ? (
            <Controller
              control={control}
              name="merchant"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('transactionForms.merchantOptional')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  placeholder={t('transactionForms.merchantShortPlaceholder')}
                />
              )}
            />
          ) : null}
        </FormSection>

        <FormSection label={t('transactionForms.account')}>
          {accounts?.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {accounts.map((acc) => (
                <FormChip
                  key={acc.id}
                  label={acc.name}
                  selected={accountId === acc.id}
                  onPress={() => setValue('account_id', acc.id)}
                  icon="wallet-outline"
                />
              ))}
            </View>
          ) : (
            <AppText style={{ color: colors.destructive }}>{t('transactionForms.noAccounts')}</AppText>
          )}
        </FormSection>

        <FormSection label={`${t('transactionForms.category')}${categories?.length ? ` (${categories.length})` : ''}`}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories?.map((cat) => (
              <FormChip
                key={cat.id}
                label={cat.name}
                selected={categoryId === cat.id}
                onPress={() => setValue('category_id', cat.id)}
                color={cat.color}
                icon={getCategoryIcon(cat.icon)}
              />
            ))}
          </View>
        </FormSection>

        {type === 'expense' ? (
          <FormSection label={t('transactionForms.beneficiaryOptional')}>
            {beneficiaries?.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <FormChip
                  label={t('transactionForms.none')}
                  selected={!beneficiaryId}
                  onPress={() => setBeneficiaryId(null)}
                />
                {beneficiaries.map((b) => (
                  <FormChip
                    key={b.id}
                    label={b.name}
                    selected={beneficiaryId === b.id}
                    onPress={() => setBeneficiaryId(b.id)}
                    icon="person-outline"
                  />
                ))}
              </View>
            ) : (
              <AppText style={{ color: colors.mutedForeground, fontSize: 13 }}>
                {t('transactionForms.noBeneficiaries')}
              </AppText>
            )}
          </FormSection>
        ) : null}

        <PressableScale
          onPress={pickPhoto}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            padding: 14,
            backgroundColor: colors.card,
            borderRadius: radius,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="camera" size={20} color={colors.primary} />
          </View>
          <AppText style={{ flex: 1, fontFamily: Font.medium }}>
            {photoUri ? t('transactionForms.photoSelected') : t('transactionForms.addPhotoOptional')}
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </PressableScale>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: '100%', height: 140, borderRadius: radius, marginBottom: 16 }}
            resizeMode="cover"
          />
        ) : null}

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <AmountCalculator
              value={value}
              onChange={onChange}
              currency={currency}
              showIva={type === 'expense'}
              tone={type === 'expense' ? 'expense' : 'income'}
            />
          )}
        />
        {errors.amount?.message ? (
          <AppText style={{ color: colors.destructive, marginBottom: 12 }}>{errors.amount.message}</AppText>
        ) : null}

        {amount > 0 ? (
          <AppText style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
            {t('transactionForms.totalToSave', { amount: formatCurrency(amount, currency) })}
          </AppText>
        ) : null}

        <PrimarySaveButton title={saveLabel} onPress={onSave} loading={isSaving} style={{ marginBottom: 12 }} />

        {id ? (
          <Button
            title={t('smartFill.deleteMovement')}
            variant="destructive"
            onPress={handleDelete}
            loading={deleteTx.isPending}
            style={{ marginBottom: 16 }}
          />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}
