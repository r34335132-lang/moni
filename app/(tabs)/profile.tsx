import React, { useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { profileService } from '@/src/services/transactionService';
import { subscriptionService } from '@/src/services/subscriptionService';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { getErrorMessage } from '@/src/core/utils/errors';
import type { AppLocale } from '@/src/core/i18n/types';

const CURRENCIES = ['MXN', 'USD', 'EUR', 'COP', 'ARS'];
const LOCALES: { id: AppLocale; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
];

export default function ProfileScreen() {
  const { profile, user, signOut, deleteAccount, refreshProfile, isPremium } = useAuth();
  const { colors, radius } = useTheme();
  const { t, locale, setLocale } = useLanguage();
  const premiumReady = subscriptionService.isConfigured();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [currency, setCurrency] = useState(profile?.currency ?? 'MXN');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await profileService.update(user.id, { full_name: name, currency });
      await refreshProfile();
      Alert.alert(t('common.saved'), t('profile.savedOk'));
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/(auth)/login');
            } catch (e) {
              Alert.alert(t('common.error'), getErrorMessage(e));
            }
          },
        },
      ],
    );
  };

  const menuItems = [
    { icon: 'list-outline' as const, label: t('profile.movements'), route: '/(tabs)/transactions' },
    { icon: 'bar-chart-outline' as const, label: t('profile.reports'), route: '/reports' },
    { icon: 'people-outline' as const, label: t('profile.beneficiaries'), route: '/beneficiaries' },
    { icon: 'wallet-outline' as const, label: t('profile.accounts'), route: '/accounts' },
    { icon: 'grid-outline' as const, label: t('profile.categories'), route: '/categories' },
    { icon: 'alarm-outline' as const, label: t('profile.reminders'), route: '/(tabs)/reminders' },
    { icon: 'game-controller-outline' as const, label: t('profile.minigames'), route: '/minigame' },
    { icon: 'business-outline' as const, label: t('profile.banks'), route: '/bank' },
    { icon: 'flag-outline' as const, label: t('profile.savingsGoals'), route: '/savings-goals' },
    {
      icon: 'diamond-outline' as const,
      label: isPremium ? t('profile.premiumActive') : premiumReady ? t('profile.premium') : t('profile.premiumSoon'),
      route: '/subscription',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      <ScreenContainer>
        <Input label={t('profile.name')} value={name} onChangeText={setName} />
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', marginBottom: 8 }}>{t('profile.currency')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCurrency(c)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: radius,
                backgroundColor: currency === c ? colors.primary : colors.secondary,
                borderWidth: 1,
                borderColor: currency === c ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: currency === c ? colors.primaryForeground : colors.foreground, fontWeight: '500' }}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', marginBottom: 8 }}>{t('profile.language')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {LOCALES.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => setLocale(opt.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: radius,
                backgroundColor: locale === opt.id ? colors.primary : colors.secondary,
                borderWidth: 1,
                borderColor: locale === opt.id ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: locale === opt.id ? colors.primaryForeground : colors.foreground, fontWeight: '500' }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button title={t('profile.saveChanges')} onPress={handleSave} loading={saving} />

        <View style={{ marginTop: 24 }}>
          {menuItems.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as never)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Ionicons name={item.icon} size={22} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontSize: 16, marginLeft: 14, flex: 1 }}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <Button title={t('profile.signOut')} variant="secondary" onPress={signOut} style={{ marginTop: 24 }} />
        <Button title={t('profile.deleteAccount')} variant="destructive" onPress={handleDeleteAccount} style={{ marginTop: 12 }} />

        <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          {profile?.email} · MONI v1.0.0
        </Text>
      </ScreenContainer>
    </View>
  );
}
