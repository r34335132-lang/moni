import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, Pressable, Image, Platform } from 'react-native';
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
import { formatCurrency } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';
import { transactionService } from '@/src/services/transactionService';

export default function AddManualTransactionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
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

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<TransactionInput>({
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
  const isSaving = createTx.isPending || updateTx.isPending;
  const saveLabel = id ? t('transactionForms.updateMovement') : (type === 'expense' ? t('transactionForms.saveExpense') : t('transactionForms.saveIncome'));

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

  const onSubmit = useCallback(async (data: TransactionInput) => {
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
  }, [id, type, beneficiaryId, updateTx, createTx, photoUri, user, t]);

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
      <ScreenHeader title={id ? t('transactionForms.editTitle') : t('transactionForms.addManual')} showBack />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) + 40 }}
        keyboardShouldPersistTaps="handled"
        extraKeyboardSpace={Platform.OS === 'ios' ? 40 : 80}
      >
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {(['expense', 'income'] as const).map((txType) => (
            <Pressable
              key={txType}
              onPress={() => { setType(txType); setValue('type', txType); }}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: radius,
                backgroundColor: type === txType ? colors.primary : colors.secondary,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: type === txType ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: type === txType ? colors.primaryForeground : colors.foreground, fontWeight: '700', fontSize: 16 }}>
                {txType === 'expense' ? t('common.expense') : t('common.income')}
              </Text>
            </Pressable>
          ))}
        </View>

        <DatePickerField label={t('transactionForms.transactionDate')} value={selectedDate} onChange={handleDateChange} maximumDate={new Date()} />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label={type === 'income' ? t('transactionForms.descriptionIncome') : t('transactionForms.descriptionExpense')}
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

        {type === 'expense' && (
          <Controller control={control} name="merchant" render={({ field: { onChange, value } }) => (
            <Input label={t('transactionForms.merchantOptional')} value={value ?? ''} onChangeText={onChange} placeholder={t('transactionForms.merchantShortPlaceholder')} />
          )} />
        )}

        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', marginBottom: 8 }}>{t('transactionForms.account')}</Text>
        {accounts?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {accounts.map((acc) => (
              <Controller key={acc.id} control={control} name="account_id" render={({ field: { onChange, value } }) => (
                <Pressable
                  onPress={() => onChange(acc.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: radius,
                    backgroundColor: value === acc.id ? colors.primary : colors.secondary,
                    borderWidth: 1,
                    borderColor: value === acc.id ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: value === acc.id ? colors.primaryForeground : colors.foreground, fontWeight: '500' }}>{acc.name}</Text>
                </Pressable>
              )} />
            ))}
          </View>
        ) : (
          <Text style={{ color: colors.destructive, marginBottom: 14 }}>{t('transactionForms.noAccounts')}</Text>
        )}

        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', marginBottom: 8 }}>
          {t('transactionForms.category')} {categories?.length ? `(${categories.length})` : ''}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {categories?.map((cat) => (
            <Controller key={cat.id} control={control} name="category_id" render={({ field: { onChange, value } }) => (
              <Pressable
                onPress={() => onChange(cat.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: radius,
                  backgroundColor: value === cat.id ? `${cat.color}30` : colors.secondary,
                  borderWidth: 1.5,
                  borderColor: value === cat.id ? cat.color : colors.border,
                  minWidth: '30%',
                }}
              >
                <Ionicons name={getCategoryIcon(cat.icon)} size={16} color={cat.color} />
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: value === cat.id ? '600' : '400' }} numberOfLines={1}>
                  {cat.name}
                </Text>
              </Pressable>
            )} />
          ))}
        </View>

        {type === 'expense' && (
          <>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', marginBottom: 8 }}>{t('transactionForms.beneficiaryOptional')}</Text>
            {beneficiaries?.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <Pressable
                  onPress={() => setBeneficiaryId(null)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: radius,
                    backgroundColor: !beneficiaryId ? colors.primary : colors.secondary,
                    borderWidth: 1,
                    borderColor: !beneficiaryId ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: !beneficiaryId ? colors.primaryForeground : colors.foreground, fontSize: 13 }}>{t('transactionForms.none')}</Text>
                </Pressable>
                {beneficiaries.map((b) => (
                  <Pressable
                    key={b.id}
                    onPress={() => setBeneficiaryId(b.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: radius,
                      backgroundColor: beneficiaryId === b.id ? colors.primary : colors.secondary,
                      borderWidth: 1,
                      borderColor: beneficiaryId === b.id ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ color: beneficiaryId === b.id ? colors.primaryForeground : colors.foreground, fontSize: 13 }}>{b.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 16 }}>
                {t('transactionForms.noBeneficiaries')}
              </Text>
            )}
          </>
        )}

        <Pressable onPress={pickPhoto} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, padding: 12, backgroundColor: colors.secondary, borderRadius: radius }}>
          <Ionicons name="camera-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.foreground }}>{photoUri ? t('transactionForms.photoSelected') : t('transactionForms.addPhotoOptional')}</Text>
        </Pressable>
        {photoUri && <Image source={{ uri: photoUri }} style={{ width: '100%', height: 120, borderRadius: radius, marginBottom: 16 }} resizeMode="cover" />}

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <AmountCalculator
              value={value}
              onChange={onChange}
              showIva={type === 'expense'}
            />
          )}
        />
        {errors.amount?.message ? (
          <Text style={{ color: colors.destructive, marginBottom: 12 }}>{errors.amount.message}</Text>
        ) : null}

        {amount > 0 ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
            {t('transactionForms.totalToSave', { amount: formatCurrency(amount, 'MXN') })}
          </Text>
        ) : null}

        <PrimarySaveButton title={saveLabel} onPress={onSave} loading={isSaving} style={{ marginBottom: 12 }} />

        {id ? (
          <Button title={t('smartFill.deleteMovement')} variant="destructive" onPress={handleDelete} loading={deleteTx.isPending} style={{ marginBottom: 16 }} />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

