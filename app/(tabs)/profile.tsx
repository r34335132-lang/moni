import React, { useState } from 'react';
import { View, Alert, ActivityIndicator, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTutorial } from '@/src/providers/TutorialProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { profileService } from '@/src/services/transactionService';
import { avatarService, AvatarPermissionError, type AvatarSource } from '@/src/services/avatarService';
import { subscriptionService } from '@/src/services/subscriptionService';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import { FormModal } from '@/src/components/ui/FormModal';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { SettingsGroup, SettingsRow, SectionLabel } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/Glass';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { AppText, Font } from '@/src/components/ui/AppText';
import { getErrorMessage } from '@/src/core/utils/errors';
import type { AppLocale } from '@/src/core/i18n/types';

const CURRENCIES = ['MXN', 'USD', 'EUR', 'COP', 'ARS'];
const LOCALES: { id: AppLocale; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
];

export default function ProfileScreen() {
  const { profile, user, signOut, deleteAccount, refreshProfile, isPremium } = useAuth();
  const { colors, radiusPill, isDark } = useTheme();
  const { t, locale, setLocale } = useLanguage();
  const premiumReady = subscriptionService.isConfigured();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [currency, setCurrency] = useState(profile?.currency ?? 'MXN');
  const [saving, setSaving] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { replay } = useTutorial();

  const changePhoto = (source: AvatarSource | 'remove') => {
    if (!user) return;
    setPhotoSheet(false);
    // iOS can't present the picker while the sheet is still dismissing.
    setTimeout(async () => {
      try {
        if (source === 'remove') {
          setUploadingPhoto(true);
          await avatarService.remove(user.id);
        } else {
          const asset = await avatarService.pick(source);
          if (!asset) return;
          setUploadingPhoto(true);
          await avatarService.upload(user.id, asset);
        }
        await refreshProfile();
      } catch (e) {
        if (e instanceof AvatarPermissionError) {
          Alert.alert(
            t('common.permissionRequired'),
            e.source === 'camera' ? t('profile.photoCameraDenied') : t('profile.photoLibraryDenied'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('transactionForms.openSettings'), onPress: () => Linking.openSettings() },
            ],
          );
        } else {
          Alert.alert(t('common.error'), getErrorMessage(e));
        }
      } finally {
        setUploadingPhoto(false);
      }
    }, 450);
  };

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
    Alert.alert(t('profile.deleteAccount'), t('profile.deleteAccountConfirm'), [
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
    ]);
  };

  const menuItems = [
    { icon: 'list-outline' as const, label: t('profile.movements'), route: '/(tabs)/transactions' },
    { icon: 'bar-chart-outline' as const, label: t('profile.reports'), route: '/reports' },
    { icon: 'people-outline' as const, label: t('profile.beneficiaries'), route: '/beneficiaries' },
    { icon: 'wallet-outline' as const, label: t('profile.accounts'), route: '/accounts' },
    { icon: 'grid-outline' as const, label: t('profile.categories'), route: '/categories' },
    { icon: 'flag-outline' as const, label: t('profile.savingsGoals'), route: '/savings-goals' },
  ];

  const moreItems = [
    { icon: 'logo-whatsapp' as const, label: t('profile.whatsapp'), route: '/whatsapp' },
    { icon: 'game-controller-outline' as const, label: t('profile.minigames'), route: '/minigame' },
    { icon: 'business-outline' as const, label: t('profile.banks'), route: '/bank' },
    {
      icon: 'diamond-outline' as const,
      label: isPremium
        ? t('profile.premiumActive')
        : premiumReady
          ? t('profile.premium')
          : t('profile.premiumSoon'),
      route: '/subscription',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('profile.title')} />
      <ScreenContainer>
        <AnimatedIn>
          <View
            style={{
              alignItems: 'center',
              marginBottom: 22,
              backgroundColor: colors.card,
              borderRadius: 28,
              paddingVertical: 24,
              paddingHorizontal: 20,
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.28 : 0.06,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 3,
            }}
          >
            <PressableScale
              onPress={() => setPhotoSheet(true)}
              disabled={uploadingPhoto}
              scaleTo={0.95}
              accessibilityLabel={profile?.avatar_url ? t('profile.changePhoto') : t('profile.addPhoto')}
              style={{ marginBottom: 12 }}
            >
              <UserAvatar uri={profile?.avatar_url} name={profile?.full_name || profile?.email} size={88} />
              {uploadingPhoto ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 44,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
              <View
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: colors.primary,
                  borderWidth: 3,
                  borderColor: colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="camera" size={14} color={colors.primaryForeground} />
              </View>
            </PressableScale>
            {!profile?.avatar_url && !uploadingPhoto ? (
              <AppText
                onPress={() => setPhotoSheet(true)}
                style={{ color: colors.primary, fontFamily: Font.semibold, fontSize: 13, marginTop: -4, marginBottom: 8 }}
              >
                {t('profile.addPhoto')}
              </AppText>
            ) : null}
            <AppText style={{ fontFamily: Font.bold, fontSize: 22, letterSpacing: -0.3 }}>
              {profile?.full_name || t('profile.name')}
            </AppText>
            <AppText style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 4 }}>
              {profile?.email}
            </AppText>
            {isPremium ? (
              <View
                style={{
                  marginTop: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.accent,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radiusPill,
                }}
              >
                <Ionicons name="diamond" size={14} color={colors.primary} />
                <AppText style={{ color: colors.accentForeground, fontFamily: Font.semibold, fontSize: 13 }}>
                  {t('profile.premiumActive')}
                </AppText>
              </View>
            ) : null}
          </View>
        </AnimatedIn>

        <SectionLabel>{t('profile.subtitle')}</SectionLabel>
        <AnimatedIn index={1}>
          <SettingsGroup>
          <View style={{ padding: 16 }}>
            <Input label={t('profile.name')} value={name} onChangeText={setName} />
            <AppText style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: Font.medium, marginBottom: 8 }}>
              {t('profile.currency')}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {CURRENCIES.map((c) => {
                const selected = currency === c;
                return (
                  <PressableScale
                    key={c}
                    onPress={() => setCurrency(c)}
                    scaleTo={0.96}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: radiusPill,
                      backgroundColor: selected ? colors.primary : colors.fill,
                    }}
                  >
                    <AppText
                      style={{
                        color: selected ? colors.primaryForeground : colors.foreground,
                        fontFamily: Font.semibold,
                        fontSize: 14,
                      }}
                    >
                      {c}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>

            <AppText style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: Font.medium, marginBottom: 8 }}>
              {t('profile.language')}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {LOCALES.map((opt) => {
                const selected = locale === opt.id;
                return (
                  <PressableScale
                    key={opt.id}
                    onPress={() => setLocale(opt.id)}
                    scaleTo={0.96}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: radiusPill,
                      backgroundColor: selected ? colors.primary : colors.fill,
                    }}
                  >
                    <AppText
                      style={{
                        color: selected ? colors.primaryForeground : colors.foreground,
                        fontFamily: Font.semibold,
                        fontSize: 14,
                      }}
                    >
                      {opt.label}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
            <Button title={t('profile.saveChanges')} onPress={handleSave} loading={saving} />
          </View>
        </SettingsGroup>
        </AnimatedIn>

        <SectionLabel>{t('profile.movements')}</SectionLabel>
        <AnimatedIn index={2}>
          <SettingsGroup>
            {menuItems.map((item, i) => (
              <SettingsRow
                key={item.route}
                icon={item.icon}
                label={item.label}
                onPress={() => router.push(item.route as never)}
                isLast={i === menuItems.length - 1}
              />
            ))}
          </SettingsGroup>
        </AnimatedIn>

        <SectionLabel>{t('profile.premium')}</SectionLabel>
        <AnimatedIn index={3}>
          <SettingsGroup>
            {moreItems.map((item, i) => (
              <SettingsRow
                key={item.route}
                icon={item.icon}
                label={item.label}
                onPress={() => router.push(item.route as never)}
                isLast={i === moreItems.length - 1}
              />
            ))}
          </SettingsGroup>
        </AnimatedIn>

        <SectionLabel>{t('profile.help')}</SectionLabel>
        <AnimatedIn index={4}>
          <SettingsGroup>
            <SettingsRow icon="sparkles-outline" label={t('profile.replayTutorial')} onPress={replay} isLast />
          </SettingsGroup>
        </AnimatedIn>

        <AnimatedIn index={5}>
          <SettingsGroup>
            <SettingsRow icon="log-out-outline" label={t('profile.signOut')} onPress={signOut} />
            <SettingsRow
              icon="trash-outline"
              label={t('profile.deleteAccount')}
              onPress={handleDeleteAccount}
              destructive
              isLast
            />
          </SettingsGroup>
        </AnimatedIn>

        <AppText style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', marginBottom: 24, marginTop: 8 }}>
          {t('brand.name')} · v1.0.0
        </AppText>
      </ScreenContainer>

      <FormModal visible={photoSheet} onClose={() => setPhotoSheet(false)} title={t('profile.photoTitle')}>
        <SettingsGroup>
          <SettingsRow icon="camera-outline" label={t('profile.takePhoto')} onPress={() => changePhoto('camera')} />
          <SettingsRow
            icon="images-outline"
            label={t('profile.chooseFromGallery')}
            onPress={() => changePhoto('library')}
            isLast={!profile?.avatar_url}
          />
          {profile?.avatar_url ? (
            <SettingsRow icon="trash-outline" label={t('profile.removePhoto')} onPress={() => changePhoto('remove')} destructive isLast />
          ) : null}
        </SettingsGroup>
      </FormModal>
    </View>
  );
}
