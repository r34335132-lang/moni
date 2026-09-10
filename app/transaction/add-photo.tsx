import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, Pressable, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseReceiptFromImage } from '@/src/services/receiptParserService';
import {
  accountMethod,
  matchCategoryId,
  suggestAccountId,
  suggestCategoryName,
  type PaymentMethod,
} from '@/src/services/smartFillService';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useCategories } from '@/src/hooks/useCategories';
import { useCreateTransaction } from '@/src/hooks/useTransactions';
import { useAuth } from '@/src/providers/AuthProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { SmartTransactionConfirm } from '@/src/components/SmartTransactionConfirm';
import { getErrorMessage } from '@/src/core/utils/errors';
import { parseAmount, roundMoney } from '@/src/core/utils/format';
import { transactionService } from '@/src/services/transactionService';

export default function AddPhotoTransactionScreen() {
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [paymentHint, setPaymentHint] = useState<PaymentMethod | null>(null);
  const [ocrText, setOcrText] = useState('');
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories(type);
  const createTx = useCreateTransaction();

  const hintText = `${merchant} ${description} ${ocrText}`;
  const suggestedCategory = useMemo(
    () => suggestCategoryName(hintText, categories),
    [hintText, categories],
  );
  const selectedCategoryName = categories?.find((c) => c.id === categoryId)?.name;
  const selectedAccountName = accounts?.find((a) => a.id === accountId)?.name;

  const ideaSummary = useMemo(() => {
    const parts: string[] = [];
    parts.push(type === 'expense' ? t('common.expense') : t('common.income'));
    if (amount) parts.push(`${amount}`);
    if (merchant) parts.push(t('transactionForms.ideaAt', { merchant }));
    parts.push(t('transactionForms.ideaCategory', { name: selectedCategoryName ?? suggestedCategory ?? t('transactionForms.ideaToConfirm') }));
    const pay = paymentHint === 'cash' ? t('transactionForms.cash').toLowerCase() : paymentHint === 'card' ? t('transactionForms.card').toLowerCase() : selectedAccountName;
    if (pay) parts.push(t('transactionForms.ideaPaidWith', { method: pay }));
    return parts.join(' · ');
  }, [type, amount, merchant, selectedCategoryName, suggestedCategory, paymentHint, selectedAccountName, t]);

  useEffect(() => {
    if (!accounts?.length || accountId) return;
    const id = suggestAccountId(accounts, paymentHint, hintText);
    if (id) setAccountId(id);
  }, [accounts, accountId, paymentHint, hintText]);

  useEffect(() => {
    if (!categories?.length) return;
    setCategoryId((current) => {
      if (current && categories.some((c) => c.id === current)) return current;
      return matchCategoryId(suggestedCategory, categories) ?? categories[0].id;
    });
  }, [categories, suggestedCategory]);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.permissionRequired'), t('transactionForms.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
    if (!result.canceled) await processImage(result.assets[0].uri, result.assets[0].base64);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled) await processImage(result.assets[0].uri, result.assets[0].base64);
  };

  const processImage = async (uri: string, base64?: string | null) => {
    setPhotoUri(uri);
    setLoading(true);
    try {
      const data = await parseReceiptFromImage(uri, base64);
      setOcrText(data.rawText);
      if (data.merchant) setMerchant(data.merchant);
      if (data.total != null) setAmount(String(data.total));
      if (data.date) setDate(new Date(data.date));
      const itemsText = data.items.map((i) => i.name).join(' ');
      const idea = suggestCategoryName(`${data.merchant ?? ''} ${itemsText} ${data.rawText}`, categories);
      if (idea && categories?.length) {
        const id = matchCategoryId(idea, categories);
        if (id) setCategoryId(id);
      }
      setPaymentHint(data.paymentMethod);
      if (accounts?.length) {
        setAccountId(suggestAccountId(accounts, data.paymentMethod, data.rawText) ?? accounts[0].id);
      }
      setDescription(data.merchant ? t('transactionForms.ticketPrefix', { merchant: data.merchant }) : t('transactionForms.scannedTicket'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const parsedAmount = parseAmount(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert(t('common.amount'), t('transactionForms.amountReviewTicket'));
      return;
    }
    if (!accountId) {
      Alert.alert(t('transactionForms.account'), t('transactionForms.accountRequired'));
      return;
    }
    try {
      const tx = await createTx.mutateAsync({
        type,
        amount: roundMoney(parsedAmount),
        account_id: accountId,
        category_id: categoryId,
        merchant: merchant.trim() || undefined,
        description: description.trim() || merchant.trim() || t('transactionForms.ticketFallback'),
        tags: [],
        transaction_date: date.toISOString(),
      });
      router.back();
      if (photoUri && user) {
        try {
          const uploaded = await transactionService.uploadPhoto(user.id, photoUri);
          await transactionService.addPhoto(user.id, tx.id, uploaded.path, uploaded.url, {
            merchant,
            total: parsedAmount,
            categoryId,
            accountId,
            paymentMethod: paymentHint,
            rawText: ocrText,
          });
        } catch {
          Alert.alert(t('common.notice'), t('transactionForms.photoAttachFailed'));
        }
      }
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('transactionForms.addPhoto')} showBack />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) + 40 }}
        keyboardShouldPersistTaps="handled"
        extraKeyboardSpace={Platform.OS === 'ios' ? 40 : 80}
      >
        {!photoUri ? (
          <View style={{ gap: 12, marginTop: 20 }}>
            <Pressable onPress={takePhoto} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="camera" size={28} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '500' }}>{t('transactionForms.takePhoto')}</Text>
            </Pressable>
            <Pressable onPress={pickFromGallery} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="images" size={28} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '500' }}>{t('transactionForms.gallery')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Image source={{ uri: photoUri }} style={{ width: '100%', height: 180, borderRadius: radius, marginBottom: 16 }} resizeMode="cover" />
            {loading ? (
              <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 }}>
                {t('transactionForms.readingTicket')}
              </Text>
            ) : (
              <>
                <SmartTransactionConfirm
                  type={type}
                  onTypeChange={setType}
                  amount={amount}
                  onAmountChange={setAmount}
                  merchant={merchant}
                  onMerchantChange={setMerchant}
                  description={description}
                  onDescriptionChange={setDescription}
                  date={date}
                  onDateChange={setDate}
                  accounts={accounts ?? []}
                  categories={categories ?? []}
                  accountId={accountId}
                  onAccountChange={(id) => {
                    setAccountId(id);
                    const acc = accounts?.find((a) => a.id === id);
                    if (acc) setPaymentHint(accountMethod(acc));
                  }}
                  categoryId={categoryId}
                  onCategoryChange={setCategoryId}
                  suggestedCategory={suggestedCategory}
                  suggestedPayment={paymentHint}
                  ideaSummary={ideaSummary}
                />
                <PrimarySaveButton
                  title={t('transactionForms.confirmSave')}
                  onPress={handleConfirm}
                  loading={createTx.isPending}
                  style={{ marginTop: 8 }}
                />
              </>
            )}
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
