import React, { useState } from 'react';
import { Text, Alert, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/src/core/validation/schemas';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { Input } from '@/src/components/ui/Input';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { BigButton } from '@/src/components/auth/BigButton';
import { getErrorMessage } from '@/src/core/utils/errors';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterInput) => {
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
      <Controller control={control} name="fullName" render={({ field: { onChange, value } }) => (
        <Input label={t('auth.fullName')} value={value} onChangeText={onChange} error={errors.fullName?.message} placeholder={t('auth.namePlaceholder')} />
      )} />
      <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
        <Input label={t('auth.email')} value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} placeholder={t('auth.emailPlaceholder')} />
      )} />
      <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
        <Input label={t('auth.password')} value={value} onChangeText={onChange} secureTextEntry error={errors.password?.message} placeholder={t('auth.passwordMinPlaceholder')} />
      )} />

      <Link href="/(auth)/login" asChild>
        <Pressable style={{ marginTop: 20, alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>
            {t('auth.haveAccount')}{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('auth.signInLink')}</Text>
          </Text>
        </Pressable>
      </Link>
    </AuthScreenLayout>
  );
}
