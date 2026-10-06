import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Alert, Platform, TextInput } from 'react-native';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseVoiceTranscript, pickBestTranscript } from '@/src/services/voiceParserService';
import {
  addSpeechRecognitionListener,
  getSpeechRecognitionModule,
  isSpeechRecognitionAvailable,
} from '@/src/services/speechRecognition';
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
import { VoiceMicOrb } from '@/src/components/VoiceMicOrb';
import { GlassSurface, PressableScale } from '@/src/components/ui/Glass';
import { FormHero } from '@/src/components/ui/FormChrome';
import { getErrorMessage } from '@/src/core/utils/errors';
import { parseAmount, roundMoney } from '@/src/core/utils/format';
import { transactionService } from '@/src/services/transactionService';
import * as Haptics from 'expo-haptics';
import type { ParsedVoiceTransaction } from '@/src/core/types/entities';

export default function AddVoiceTransactionScreen() {
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const { t, locale } = useLanguage();
  const insets = useSafeAreaInsets();
  const speechAvailable = useMemo(() => isSpeechRecognitionAvailable(), []);
  const [listening, setListening] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [draftSpeech, setDraftSpeech] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [paymentHint, setPaymentHint] = useState<PaymentMethod | null>(null);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories(type);
  const createTx = useCreateTransaction();
  const accountsRef = useRef(accounts);
  const categoriesRef = useRef(categories);
  accountsRef.current = accounts;
  categoriesRef.current = categories;

  const suggestedCategory = useMemo(
    () => suggestCategoryName(`${transcript} ${merchant} ${description}`, categories, type),
    [transcript, merchant, description, categories, type],
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

  const autoSaveWallet = async (
    parsed: ParsedVoiceTransaction,
    text: string,
    resolvedAccountId: string,
    resolvedCategoryId: string | null,
  ) => {
    if (parsed.paymentMethod !== 'wallet' || parsed.amount == null || parsed.amount <= 0) return false;
    if (!resolvedAccountId) return false;
    const enabled = await isWalletAutoSaveEnabled();
    if (!enabled) return false;
    try {
      const tx = await createTx.mutateAsync({
        type: parsed.type,
        amount: roundMoney(parsed.amount),
        account_id: resolvedAccountId,
        category_id: resolvedCategoryId,
        merchant: parsed.merchant?.trim() || undefined,
        description: (parsed.description ?? text).trim() || undefined,
        tags: walletTags('wallet', text),
        transaction_date: (parsed.date ? new Date(parsed.date) : new Date()).toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if (user && text) {
        transactionService
          .addVoiceRecord(user.id, tx.id, text, {
            amount: parsed.amount,
            categoryId: resolvedCategoryId,
            accountId: resolvedAccountId,
            paymentMethod: 'wallet',
            autoSaved: true,
          })
          .catch(() => {});
      }
      Alert.alert(t('transactionForms.walletAutoSaved'), t('transactionForms.walletAutoSavedBody'));
      router.back();
      return true;
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
      return false;
    }
  };

  const applyTranscript = async (text: string) => {
    const accs = accountsRef.current;
    const cats = categoriesRef.current;
    const parsed = parseVoiceTranscript(text);
    setType(parsed.type);
    if (parsed.amount != null) setAmount(String(parsed.amount));
    setMerchant(parsed.merchant ?? '');
    setDescription(parsed.description ?? text);
    if (parsed.date) setDate(new Date(parsed.date));
    setPaymentHint(parsed.paymentMethod);
    const nextAccountId = accs?.length
      ? suggestAccountId(accs, parsed.paymentMethod, text) ?? accs[0].id
      : '';
    if (nextAccountId) setAccountId(nextAccountId);
    let nextCategoryId: string | null = null;
    if (cats?.length) {
      nextCategoryId = matchCategoryId(suggestCategoryName(text, cats, parsed.type), cats, parsed.type)
        ?? matchCategoryId(parsed.category, cats, parsed.type)
        ?? fallbackCategoryId(cats, parsed.type);
      setCategoryId(nextCategoryId);
    }
    await autoSaveWallet(parsed, text, nextAccountId, nextCategoryId);
  };

  useEffect(() => {
    if (!accounts?.length || accountId) return;
    setAccountId(suggestAccountId(accounts, paymentHint) ?? accounts[0].id);
  }, [accounts, accountId, paymentHint]);

  useEffect(() => {
    if (!categories?.length) return;
    setCategoryId((current) => {
      if (current && categories.some((c) => c.id === current)) return current;
      return matchCategoryId(suggestedCategory, categories, type) ?? fallbackCategoryId(categories, type);
    });
  }, [categories, suggestedCategory, type]);

  useEffect(() => {
    if (!speechAvailable) return;
    const resultSub = addSpeechRecognitionListener('result', (event) => {
      const text = pickBestTranscript(event.results ?? []);
      setTranscript(text);
      if (event.isFinal && text) {
        applyTranscript(text);
        setListening(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    });
    const errorSub = addSpeechRecognitionListener('error', () => {
      setListening(false);
      Alert.alert(t('common.error'), t('transactionForms.voiceFailed'));
    });
    return () => {
      resultSub.remove();
      errorSub.remove();
    };
  }, [speechAvailable, t]);

  const startListening = async () => {
    const Speech = getSpeechRecognitionModule();
    if (!Speech) {
      Alert.alert(t('transactionForms.voiceUnavailableTitle'), t('transactionForms.voiceUnavailableBody'));
      return;
    }
    try {
      const result = await Speech.requestPermissionsAsync();
      if (!result.granted) {
        setPermissionDenied(true);
        setListening(false);
        return;
      }
      setPermissionDenied(false);
      setTranscript('');
      setListening(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      Speech.start({
        lang: locale === 'en' ? 'en-US' : 'es-MX',
        interimResults: true,
        continuous: false,
        maxAlternatives: 3,
        iosTaskHint: 'dictation',
      });
    } catch {
      setPermissionDenied(true);
      setListening(false);
    }
  };

  const stopListening = () => {
    const Speech = getSpeechRecognitionModule();
    try {
      Speech?.stop();
    } catch {
      // Ignore stop errors so a denied/cancelled session never crashes the screen.
    }
    setListening(false);
    if (transcript) applyTranscript(transcript);
  };

  const applyDraftSpeech = () => {
    const text = draftSpeech.trim();
    if (!text) return;
    setTranscript(text);
    applyTranscript(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const handleConfirm = async () => {
    const parsedAmount = parseAmount(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert(t('common.amount'), t('transactionForms.amountReview'));
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
        description: description.trim() || transcript || undefined,
        tags: walletTags(paymentHint, `${transcript} ${description}`),
        transaction_date: date.toISOString(),
      });
      router.back();
      if (user && transcript) {
        transactionService
          .addVoiceRecord(user.id, tx.id, transcript, {
            amount: parsedAmount,
            categoryId,
            accountId,
            paymentMethod: paymentHint,
          })
          .catch(() => {});
      }
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('transactionForms.addVoice')} showBack />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: Math.max(insets.bottom, 24) + 40 }}
        keyboardShouldPersistTaps="handled"
        extraKeyboardSpace={Platform.OS === 'ios' ? 40 : 80}
      >
        <FormHero icon="mic" title={t('transactionForms.addVoice')} subtitle={t('transactionForms.voiceExample')} />

        {!speechAvailable ? (
          <GlassSurface style={{ marginBottom: 16 }} padding={14} intensity={28}>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
              {t('transactionForms.voiceUnavailableTitle')}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>
              {t('transactionForms.voiceUnavailableBody')}
            </Text>
          </GlassSurface>
        ) : null}

        {permissionDenied ? (
          <View style={{ marginBottom: 16 }}>
            <PermissionDeniedBanner kind="microphone" onRetry={startListening} />
          </View>
        ) : null}

        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <VoiceMicOrb
            listening={listening}
            onPress={speechAvailable ? (listening ? stopListening : startListening) : applyDraftSpeech}
            disabled={!speechAvailable && !draftSpeech.trim()}
          />
          <Text style={{ color: colors.mutedForeground, marginTop: 14, fontSize: 15, fontWeight: '600' }}>
            {speechAvailable
              ? listening
                ? t('transactionForms.listening')
                : t('transactionForms.tapToSpeak')
              : t('transactionForms.typePhraseHint')}
          </Text>
          <Text style={{ color: colors.foreground, marginTop: 8, fontSize: 13, textAlign: 'center', paddingHorizontal: 16, lineHeight: 19, opacity: 0.8 }}>
            {t('transactionForms.voiceExample')}
          </Text>
        </View>

        {!speechAvailable || !transcript ? (
          <GlassSurface style={{ marginBottom: 16 }} padding={12} intensity={24}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 8, fontWeight: '700' }}>
              {t('transactionForms.typePhrase')}
            </Text>
            <TextInput
              value={draftSpeech}
              onChangeText={setDraftSpeech}
              placeholder={t('transactionForms.voiceExample')}
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={{
                color: colors.foreground,
                fontSize: 16,
                lineHeight: 22,
                minHeight: 72,
                textAlignVertical: 'top',
              }}
            />
            <PressableScale
              onPress={applyDraftSpeech}
              style={{
                marginTop: 10,
                alignSelf: 'flex-end',
                backgroundColor: colors.primary,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: radius,
              }}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>
                {t('transactionForms.parsePhrase')}
              </Text>
            </PressableScale>
          </GlassSurface>
        ) : null}

        {transcript ? (
          <GlassSurface style={{ marginBottom: 16 }} padding={14} intensity={28}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 6, fontWeight: '700' }}>
              {t('transactionForms.transcription')}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 16, lineHeight: 22 }}>{transcript}</Text>
          </GlassSurface>
        ) : null}

        {(transcript || amount) ? (
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
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}
