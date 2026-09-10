import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Alert, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { parseVoiceTranscript } from '@/src/services/voiceParserService';
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
import { Card } from '@/src/components/ui/Card';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { SmartTransactionConfirm } from '@/src/components/SmartTransactionConfirm';
import { getErrorMessage } from '@/src/core/utils/errors';
import { parseAmount, roundMoney } from '@/src/core/utils/format';
import { transactionService } from '@/src/services/transactionService';

export default function AddVoiceTransactionScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
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
    () => suggestCategoryName(`${transcript} ${merchant} ${description}`, categories),
    [transcript, merchant, description, categories],
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

  const applyTranscript = (text: string) => {
    const accs = accountsRef.current;
    const cats = categoriesRef.current;
    const parsed = parseVoiceTranscript(text);
    setType(parsed.type);
    if (parsed.amount != null) setAmount(String(parsed.amount));
    setMerchant(parsed.merchant ?? '');
    setDescription(parsed.description ?? text);
    if (parsed.date) setDate(new Date(parsed.date));
    setPaymentHint(parsed.paymentMethod);
    if (accs?.length) {
      setAccountId(suggestAccountId(accs, parsed.paymentMethod, text) ?? accs[0].id);
    }
    if (cats?.length) {
      const id = matchCategoryId(parsed.category ?? suggestCategoryName(text, cats), cats);
      setCategoryId(id ?? cats[0].id);
    }
  };

  useEffect(() => {
    if (!accounts?.length || accountId) return;
    setAccountId(suggestAccountId(accounts, paymentHint) ?? accounts[0].id);
  }, [accounts, accountId, paymentHint]);

  useEffect(() => {
    if (!categories?.length) return;
    setCategoryId((current) => {
      if (current && categories.some((c) => c.id === current)) return current;
      return matchCategoryId(suggestedCategory, categories) ?? categories[0].id;
    });
  }, [categories, suggestedCategory]);

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    if (event.isFinal) {
      applyTranscript(text);
      setListening(false);
    }
  });

  useSpeechRecognitionEvent('error', () => {
    setListening(false);
    Alert.alert(t('common.error'), t('transactionForms.voiceFailed'));
  });

  const startListening = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      Alert.alert(t('common.permissionRequired'), t('transactionForms.micPermission'));
      return;
    }
    setTranscript('');
    setListening(true);
    ExpoSpeechRecognitionModule.start({ lang: 'es-MX', interimResults: true, continuous: false });
  };

  const stopListening = () => {
    ExpoSpeechRecognitionModule.stop();
    setListening(false);
    if (transcript) applyTranscript(transcript);
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
        tags: [],
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
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) + 40 }}
        keyboardShouldPersistTaps="handled"
        extraKeyboardSpace={Platform.OS === 'ios' ? 40 : 80}
      >
        <View style={{ alignItems: 'center', marginVertical: 24 }}>
          <Pressable
            onPress={listening ? stopListening : startListening}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: listening ? colors.destructive : colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={listening ? 'stop' : 'mic'} size={40} color="#FFF" />
          </Pressable>
          <Text style={{ color: colors.mutedForeground, marginTop: 16, fontSize: 15 }}>
            {listening ? t('transactionForms.listening') : t('transactionForms.tapToSpeak')}
          </Text>
          <Text style={{ color: colors.foreground, marginTop: 8, fontSize: 13, textAlign: 'center', paddingHorizontal: 12 }}>
            {t('transactionForms.voiceExample')}
          </Text>
        </View>

        {transcript ? (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 4 }}>{t('transactionForms.transcription')}</Text>
            <Text style={{ color: colors.foreground, fontSize: 15 }}>{transcript}</Text>
          </Card>
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
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}
