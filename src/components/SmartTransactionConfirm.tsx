import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { Input } from '@/src/components/ui/Input';
import { DatePickerField } from '@/src/components/ui/DatePickerField';
import { getCategoryIcon } from '@/src/core/constants/categories';
import { accountMethod, type PaymentMethod } from '@/src/services/smartFillService';
import type { Account, Category } from '@/src/core/types/entities';

interface SmartTransactionConfirmProps {
  type: 'income' | 'expense';
  onTypeChange: (type: 'income' | 'expense') => void;
  amount: string;
  onAmountChange: (value: string) => void;
  merchant: string;
  onMerchantChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  date: Date;
  onDateChange: (date: Date) => void;
  accounts: Account[];
  categories: Category[];
  accountId: string;
  onAccountChange: (id: string) => void;
  categoryId: string | null;
  onCategoryChange: (id: string) => void;
  suggestedCategory?: string | null;
  suggestedPayment?: PaymentMethod | null;
  ideaSummary?: string | null;
}

export function SmartTransactionConfirm({
  type,
  onTypeChange,
  amount,
  onAmountChange,
  merchant,
  onMerchantChange,
  description,
  onDescriptionChange,
  date,
  onDateChange,
  accounts,
  categories,
  accountId,
  onAccountChange,
  categoryId,
  onCategoryChange,
  suggestedCategory,
  suggestedPayment,
  ideaSummary,
}: SmartTransactionConfirmProps) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const method = selectedAccount ? accountMethod(selectedAccount) : suggestedPayment;

  const pickMethod = (next: PaymentMethod) => {
    const match =
      next === 'cash'
        ? accounts.find((a) => accountMethod(a) === 'cash')
        : accounts.find((a) => accountMethod(a) === 'card');
    if (match) onAccountChange(match.id);
  };

  return (
    <View>
      {ideaSummary ? (
        <View
          style={{
            backgroundColor: colors.secondary,
            borderRadius: radius,
            padding: 14,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>
            {t('transactionForms.ideaFill')}
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>{ideaSummary}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
            {t('transactionForms.ideaFillHint')}
          </Text>
        </View>
      ) : (
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 12, lineHeight: 20 }}>
          {t('transactionForms.ideaFillReview')}
        </Text>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {(['expense', 'income'] as const).map((txType) => (
          <Pressable
            key={txType}
            onPress={() => onTypeChange(txType)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: radius,
              alignItems: 'center',
              backgroundColor: type === txType ? colors.primary : colors.secondary,
              borderWidth: 1,
              borderColor: type === txType ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: type === txType ? colors.primaryForeground : colors.foreground, fontWeight: '700' }}>
              {txType === 'expense' ? t('common.expense') : t('common.income')}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input label={t('common.amount')} value={amount} onChangeText={onAmountChange} keyboardType="decimal-pad" placeholder="125.50" />
      <Input
        label={type === 'expense' ? t('transactionForms.merchant') : t('transactionForms.fromWho')}
        value={merchant}
        onChangeText={onMerchantChange}
        placeholder={type === 'expense' ? t('transactionForms.merchantPlaceholder') : t('transactionForms.fromWhoPlaceholder')}
      />
      <Input
        label={t('transactionForms.descriptionNote')}
        value={description}
        onChangeText={onDescriptionChange}
        placeholder={t('transactionForms.descriptionPlaceholder')}
        multiline
      />
      <DatePickerField label={t('common.date')} value={date} onChange={onDateChange} maximumDate={new Date()} />

      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
        {t('transactionForms.paidWith')}
      </Text>
      {suggestedPayment ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 8 }}>
          {t('transactionForms.suggested', {
            method: suggestedPayment === 'cash' ? t('transactionForms.cash') : t('transactionForms.card'),
          })}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        {([
          { id: 'cash' as const, label: t('transactionForms.cash'), icon: 'cash-outline' as const },
          { id: 'card' as const, label: t('transactionForms.card'), icon: 'card-outline' as const },
        ]).map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => pickMethod(opt.id)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
              borderRadius: radius,
              backgroundColor: method === opt.id ? colors.primary : colors.secondary,
              borderWidth: 1,
              borderColor: method === opt.id ? colors.primary : colors.border,
            }}
          >
            <Ionicons name={opt.icon} size={18} color={method === opt.id ? colors.primaryForeground : colors.foreground} />
            <Text style={{ color: method === opt.id ? colors.primaryForeground : colors.foreground, fontWeight: '700' }}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>{t('transactionForms.account')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {accounts.map((acc) => (
          <Pressable
            key={acc.id}
            onPress={() => onAccountChange(acc.id)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: radius,
              backgroundColor: accountId === acc.id ? colors.primary : colors.secondary,
              borderWidth: 1,
              borderColor: accountId === acc.id ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: accountId === acc.id ? colors.primaryForeground : colors.foreground, fontWeight: '600' }}>
              {acc.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
        {suggestedCategory
          ? t('transactionForms.categorySuggested', { name: suggestedCategory })
          : t('transactionForms.category')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => onCategoryChange(cat.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: radius,
              backgroundColor: categoryId === cat.id ? `${cat.color}30` : colors.secondary,
              borderWidth: 1.5,
              borderColor: categoryId === cat.id ? cat.color : colors.border,
            }}
          >
            <Ionicons name={getCategoryIcon(cat.icon)} size={16} color={cat.color} />
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: categoryId === cat.id ? '700' : '400' }}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
