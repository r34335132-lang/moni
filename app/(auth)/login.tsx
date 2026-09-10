import React, { useState } from 'react';
import { Text, Alert, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/src/core/validation/schemas';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { Input } from '@/src/components/ui/Input';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { BigButton } from '@/src/components/auth/BigButton';
import { getErrorMessage } from '@/src/core/utils/errors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      await signIn(data);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title={t('auth.login')}
      subtitle={t('auth.loginSubtitle')}
      footer={<BigButton title={t('auth.signIn')} onPress={handleSubmit(onSubmit)} loading={loading} />}
    >
      <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
        <Input label={t('auth.email')} value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} placeholder={t('auth.emailPlaceholder')} />
      )} />
      <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
        <Input label={t('auth.password')} value={value} onChangeText={onChange} secureTextEntry error={errors.password?.message} placeholder={t('auth.passwordPlaceholder')} />
      )} />

      <Link href="/(auth)/register" asChild>
        <Pressable style={{ marginTop: 20, alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>
            {t('auth.noAccount')}{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('auth.registerFree')}</Text>
          </Text>
        </Pressable>
      </Link>
    </AuthScreenLayout>
  );
}
