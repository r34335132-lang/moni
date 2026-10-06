import React, { useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { env } from '@/src/core/config/env';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/src/core/validation/schemas';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { Input } from '@/src/components/ui/Input';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { BigButton } from '@/src/components/auth/BigButton';
import { AppText, Font } from '@/src/components/ui/AppText';
import { getErrorMessage } from '@/src/core/utils/errors';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const openDoc = (url: string) => {
    if (url) Linking.openURL(url).catch(() => undefined);
  };

  const onSubmit = async (data: RegisterInput) => {
    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }
    setLoading(true);
    try {
      await signUp(data);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title={t('auth.register')}
      subtitle={t('auth.registerSubtitle')}
      showBack
      footer={<BigButton title={t('auth.createAccount')} onPress={handleSubmit(onSubmit)} loading={loading} />}
    >
      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.fullName')}
            value={value}
            onChangeText={onChange}
            error={errors.fullName?.message}
            placeholder={t('auth.namePlaceholder')}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.email')}
            value={value}
            onChangeText={onChange}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
            placeholder={t('auth.emailPlaceholder')}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.password')}
            value={value}
            onChangeText={onChange}
            secureTextEntry
            error={errors.password?.message}
            placeholder={t('auth.passwordMinPlaceholder')}
          />
        )}
      />

      <Pressable
        onPress={() => {
          setAcceptedTerms((v) => !v);
          setTermsError(false);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6, paddingVertical: 6 }}
      >
        <Ionicons
          name={acceptedTerms ? 'checkbox' : 'square-outline'}
          size={22}
          color={termsError ? colors.destructive : acceptedTerms ? colors.primary : colors.mutedForeground}
        />
        <View style={{ flex: 1 }}>
          <AppText style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20 }}>
            {t('auth.acceptTermsPrefix')}
            <AppText
              style={{ color: colors.primary, fontFamily: Font.semibold }}
              onPress={env.termsUrl ? () => openDoc(env.termsUrl) : undefined}
            >
              {t('auth.termsLink')}
            </AppText>
            {t('auth.termsAnd')}
            <AppText
              style={{ color: colors.primary, fontFamily: Font.semibold }}
              onPress={env.privacyUrl ? () => openDoc(env.privacyUrl) : undefined}
            >
              {t('auth.privacyLink')}
            </AppText>
          </AppText>
          {termsError ? (
            <AppText style={{ color: colors.destructive, fontSize: 13, marginTop: 4 }}>
              {t('auth.acceptTermsRequired')}
            </AppText>
          ) : null}
        </View>
      </Pressable>

      <Link href="/(auth)/login" asChild>
        <Pressable style={{ marginTop: 18, alignItems: 'center', paddingVertical: 8 }}>
          <AppText style={{ color: colors.mutedForeground, fontSize: 15, textAlign: 'center' }}>
            {t('auth.haveAccount')}{' '}
            <AppText style={{ color: colors.primary, fontFamily: Font.bold }}>{t('auth.signInLink')}</AppText>
          </AppText>
        </Pressable>
      </Link>
    </AuthScreenLayout>
  );
}
