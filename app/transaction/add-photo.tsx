import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, Image, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { parseReceiptFromImage } from '@/src/services/receiptParserService';
import {
  fallbackCategoryId,
  matchCategoryId,
  suggestAccountId,
  suggestCategoryName,
  type PaymentMethod,
} from '@/src/services/smartFillService';
import { isWalletAutoSaveEnabled, walletTags } from '@/src/services/walletAutoSave';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useCategories } from '@/src/hooks/useCategories';
import { useCreateTransaction } from '@/src/hooks/useTransactions';
import { useAuth } from '@/src/providers/AuthProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { SmartTransactionConfirm } from '@/src/components/SmartTransactionConfirm';
import { PermissionDeniedBanner } from '@/src/components/PermissionDeniedBanner';
import { GlassIconBadge, PressableScale } from '@/src/components/ui/Glass';
import { FormHero } from '@/src/components/ui/FormChrome';
import { getErrorMessage } from '@/src/core/utils/errors';
import { parseAmount, roundMoney } from '@/src/core/utils/format';
import { transactionService } from '@/src/services/transactionService';

export default function AddPhotoTransactionScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);
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
    () => suggestCategoryName(hintText, categories, type),
    [hintText, categories, type],
  );
  const selectedCategoryName = categories?.find((c) => c.id === categoryId)?.name;
  const selectedAccountName = accounts?.find((a) => a.id === accountId)?.name;

  const ideaSummary = useMemo(() => {
    const parts: string[] = [];
    parts.push(type === 'expense' ? t('common.expense') : t('common.income'));
    if (amount) parts.push(`${amount}`);
    if (merchant) parts.push(t('transactionForms.ideaAt', { merchant }));
    parts.push(t('transactionForms.ideaCategory', { name: selectedCategoryName ?? suggestedCategory ?? t('transactionForms.ideaToConfirm') }));
    const pay =
      paymentHint === 'cash'
        ? t('transactionForms.cash').toLowerCase()
        : paymentHint === 'wallet'
          ? t('transactionForms.wallet').toLowerCase()
          : paymentHint === 'card'
            ? t('transactionForms.card').toLowerCase()
            : selectedAccountName;
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
      return matchCategoryId(suggestedCategory, categories, type) ?? fallbackCategoryId(categories, type);
    });
  }, [categories, suggestedCategory, type]);

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setPermissionDenied('camera');
        return;
      }
      setPermissionDenied(null);
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
      if (!result.canceled) await processImage(result.assets[0].uri, result.assets[0].base64);
    } catch {
      setPermissionDenied('camera');
    }
  };

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setPermissionDenied('photos');
        return;
      }
      setPermissionDenied(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled) await processImage(result.assets[0].uri, result.assets[0].base64);
    } catch {
      setPermissionDenied('photos');
    }
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
      const idea = suggestCategoryName(`${data.merchant ?? ''} ${itemsText} ${data.rawText}`, categories, type);
      let nextCategoryId = categoryId;
      if (idea && categories?.length) {
        const id = matchCategoryId(idea, categories, type);
        if (id) {
          nextCategoryId = id;
          setCategoryId(id);
        }
      }
      setPaymentHint(data.paymentMethod);
      const nextAccountId = accounts?.length
        ? suggestAccountId(accounts, data.paymentMethod, data.rawText) ?? accounts[0].id
        : '';
      if (nextAccountId) setAccountId(nextAccountId);
      const desc = data.merchant
        ? t('transactionForms.ticketPrefix', { merchant: data.merchant })
        : t('transactionForms.scannedTicket');
      setDescription(desc);

      if (
        data.paymentMethod === 'wallet' &&
        data.total != null &&
        data.total > 0 &&
        nextAccountId &&
        (await isWalletAutoSaveEnabled())
      ) {
        try {
          const tx = await createTx.mutateAsync({
            type: 'expense',
            amount: roundMoney(data.total),
            account_id: nextAccountId,
            category_id: nextCategoryId,
            merchant: data.merchant?.trim() || undefined,
            description: desc,
            tags: walletTags('wallet', data.rawText),
            transaction_date: (data.date ? new Date(data.date) : new Date()).toISOString(),
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          if (user) {
            try {
              const uploaded = await transactionService.uploadPhoto(user.id, uri);
              await transactionService.addPhoto(user.id, tx.id, uploaded.path, uploaded.url, {
                merchant: data.merchant,
                total: data.total,
                categoryId: nextCategoryId,
                accountId: nextAccountId,
                paymentMethod: 'wallet',
                rawText: data.rawText,
                autoSaved: true,
              });
            } catch {
              /* photo attach optional */
            }
          }
          Alert.alert(t('transactionForms.walletAutoSaved'), t('transactionForms.walletAutoSavedBody'));
          router.back();
          return;
        } catch (e) {
          Alert.alert(t('common.error'), getErrorMessage(e));
        }
      }
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
        tags: walletTags(paymentHint, `${ocrText} ${description}`),
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
        contentContainerStyle={{ padding: 20, paddingBottom: Math.max(insets.bottom, 24) + 40 }}
        keyboardShouldPersistTaps="handled"
        extraKeyboardSpace={Platform.OS === 'ios' ? 40 : 80}
      >
        <FormHero icon="receipt" title={t('transactionForms.addPhoto')} subtitle={t('transactionForms.scanTicket')} />

        {!photoUri ? (
          <View style={{ gap: 12 }}>
            {permissionDenied ? (
              <PermissionDeniedBanner
                kind={permissionDenied}
                onRetry={permissionDenied === 'camera' ? takePhoto : pickFromGallery}
              />
            ) : null}
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                takePhoto();
              }}
              haptic={false}
              style={{
                borderRadius: 22,
                overflow: 'hidden',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
              }}
            >
              <BlurView intensity={28} tint={colors.background === '#0A0A0A' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['rgba(34,197,94,0.16)', 'rgba(34,197,94,0.04)']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 }}>
                <GlassIconBadge color="#30D158" size={48}>
                  <Ionicons name="camera" size={24} color="#248A3D" />
                </GlassIconBadge>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>{t('transactionForms.takePhoto')}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{t('transactionForms.scanTicket')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </View>
            </PressableScale>
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                pickFromGallery();
              }}
              haptic={false}
              style={{
                borderRadius: 22,
                overflow: 'hidden',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
              }}
            >
              <BlurView intensity={28} tint={colors.background === '#0A0A0A' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['rgba(14,165,233,0.16)', 'rgba(14,165,233,0.04)']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 }}>
                <GlassIconBadge color="#0EA5E9" size={48}>
                  <Ionicons name="images" size={24} color="#0284C7" />
                </GlassIconBadge>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>{t('transactionForms.gallery')}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{t('transactionForms.addPhoto')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </View>
            </PressableScale>
          </View>
        ) : (
          <>
            <View
              style={{
                borderRadius: 22,
                overflow: 'hidden',
                marginBottom: 16,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
              }}
            >
              <Image
                source={{ uri: photoUri }}
                style={{ width: '100%', height: 220 }}
                resizeMode="cover"
              />
              {loading ? (
                <LinearGradient
                  colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.2)']}
                  style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
                >
                  <GlassIconBadge color="#F59E0B" size={56}>
                    <Ionicons name="receipt-outline" size={26} color="#D97706" />
                  </GlassIconBadge>
                  <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 12, fontWeight: '700' }}>
                    {t('transactionForms.readingTicket')}
                  </Text>
                </LinearGradient>
              ) : null}
            </View>
            {loading ? null : (
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
                  onAccountChange={setAccountId}
                  categoryId={categoryId}
                  onCategoryChange={setCategoryId}
                  suggestedCategory={suggestedCategory}
                  suggestedPayment={paymentHint}
                  onPaymentMethodChange={setPaymentHint}
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
