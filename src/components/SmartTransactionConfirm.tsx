import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { Input } from '@/src/components/ui/Input';
import { DatePickerField } from '@/src/components/ui/DatePickerField';
import { Card } from '@/src/components/ui/Card';
import { FormChip, FormTypeToggle, FormSection } from '@/src/components/ui/FormChrome';
import { AppText, Font } from '@/src/components/ui/AppText';
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
  onPaymentMethodChange?: (method: PaymentMethod) => void;
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
  onPaymentMethodChange,
  ideaSummary,
}: SmartTransactionConfirmProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const accountPay = selectedAccount ? accountMethod(selectedAccount) : null;
  const method: PaymentMethod =
    suggestedPayment === 'wallet' ? 'wallet' : accountPay ?? suggestedPayment ?? 'card';

  const pickMethod = (next: PaymentMethod) => {
    onPaymentMethodChange?.(next);
    const match =
      next === 'cash'
        ? accounts.find((a) => accountMethod(a) === 'cash')
        : accounts.find((a) => accountMethod(a) === 'card') ?? accounts.find((a) => a.type !== 'cash');
    if (match) onAccountChange(match.id);
  };

  return (
    <View>
      {ideaSummary ? (
        <Card style={{ marginBottom: 14 }} padding={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
            <AppText style={{ fontFamily: Font.bold, fontSize: 14 }}>{t('transactionForms.ideaFill')}</AppText>
          </View>
          <AppText style={{ fontSize: 14, lineHeight: 20 }}>{ideaSummary}</AppText>
          <AppText style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
            {t('transactionForms.ideaFillHint')}
          </AppText>
        </Card>
      ) : (
        <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 12, lineHeight: 20 }}>
          {t('transactionForms.ideaFillReview')}
        </AppText>
      )}

      <FormTypeToggle
        value={type}
        onChange={(v) => onTypeChange(v as 'income' | 'expense')}
        leftLabel={t('common.expense')}
        rightLabel={t('common.income')}
      />

      <FormSection>
        <Input
          label={t('common.amount')}
          value={amount}
          onChangeText={onAmountChange}
          keyboardType="decimal-pad"
          placeholder="125.50"
        />
        <Input
          label={type === 'expense' ? t('transactionForms.merchant') : t('transactionForms.fromWho')}
          value={merchant}
          onChangeText={onMerchantChange}
          placeholder={
            type === 'expense'
              ? t('transactionForms.merchantPlaceholder')
              : t('transactionForms.fromWhoPlaceholder')
          }
        />
        <Input
          label={t('transactionForms.descriptionNote')}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder={t('transactionForms.descriptionPlaceholder')}
          multiline
        />
        <DatePickerField label={t('common.date')} value={date} onChange={onDateChange} maximumDate={new Date()} />
      </FormSection>

      <FormSection label={t('transactionForms.paidWith')}>
        {suggestedPayment ? (
          <AppText style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 8 }}>
            {t('transactionForms.suggested', {
              method:
                suggestedPayment === 'cash'
                  ? t('transactionForms.cash')
                  : suggestedPayment === 'wallet'
                    ? t('transactionForms.wallet')
                    : t('transactionForms.card'),
            })}
          </AppText>
        ) : null}
        {method === 'wallet' ? (
          <AppText style={{ color: colors.primary, fontSize: 12, marginBottom: 8, fontFamily: Font.medium }}>
            {t('transactionForms.walletDetected')}
          </AppText>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <FormChip
            label={t('transactionForms.cash')}
            selected={method === 'cash'}
            onPress={() => pickMethod('cash')}
            icon="cash-outline"
          />
          <FormChip
            label={t('transactionForms.card')}
            selected={method === 'card'}
            onPress={() => pickMethod('card')}
            icon="card-outline"
          />
          <FormChip
            label={t('transactionForms.wallet')}
            selected={method === 'wallet'}
            onPress={() => pickMethod('wallet')}
            icon="phone-portrait-outline"
          />
        </View>
      </FormSection>

      <FormSection label={t('transactionForms.account')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {accounts.map((acc) => (
            <FormChip
              key={acc.id}
              label={acc.name}
              selected={accountId === acc.id}
              onPress={() => {
                onAccountChange(acc.id);
                onPaymentMethodChange?.(accountMethod(acc));
              }}
              icon="wallet-outline"
            />
          ))}
        </View>
      </FormSection>

      <FormSection
        label={
          suggestedCategory
            ? t('transactionForms.categorySuggested', { name: suggestedCategory })
            : t('transactionForms.category')
        }
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {categories.map((cat) => (
            <FormChip
              key={cat.id}
              label={cat.name}
              selected={categoryId === cat.id}
              onPress={() => onCategoryChange(cat.id)}
              color={cat.color}
              icon={getCategoryIcon(cat.icon)}
            />
          ))}
        </View>
      </FormSection>
    </View>
  );
}
