import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { subscriptionService } from '@/src/services/subscriptionService';
import { getErrorMessage } from '@/src/core/utils/errors';

export default function SubscriptionScreen() {
  const { user, isPremium, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [offering, setOffering] = useState<Awaited<ReturnType<typeof subscriptionService.getOfferings>>>(null);
  const premiumReady = subscriptionService.isConfigured();

  const premiumFeatures = [
    t('subscription.featureBank'),
    t('subscription.featureScan'),
    t('subscription.featureVoice'),
    t('subscription.featureReports'),
    t('subscription.featureGoals'),
    t('subscription.featureAds'),
  ];

  useEffect(() => {
    if (user) {
      subscriptionService.configure(user.id).then(async () => {
        try {
          if (premiumReady) {
            const current = await subscriptionService.getOfferings();
            setOffering(current);
          }
        } finally {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
  }, [premiumReady, user]);

  const handlePurchase = async () => {
    if (!offering?.availablePackages?.length) {
      Alert.alert(t('subscription.notAvailable'), t('subscription.notConfigured'));
      return;
    }
    setPurchasing(true);
    try {
      const success = await subscriptionService.purchasePackage(offering.availablePackages[0]);
      if (success && user) {
        await subscriptionService.syncSubscription(user.id, true);
        await refreshProfile();
        Alert.alert(t('subscription.activated'), t('subscription.activatedSub'));
        router.back();
      }
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const restored = await subscriptionService.restorePurchases();
      if (restored && user) {
        await subscriptionService.syncSubscription(user.id, true);
        await refreshProfile();
        Alert.alert(t('subscription.restored'), t('subscription.restoredSub'));
      } else {
        Alert.alert(t('subscription.noSubscription'), t('subscription.noSubscriptionSub'));
      }
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('subscription.title')} showBack />
      <ScreenContainer>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Ionicons name="diamond" size={48} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginTop: 12 }}>
            {isPremium ? t('subscription.active') : premiumReady ? t('subscription.unlock') : t('subscription.comingSoonTitle')}
          </Text>
        </View>

        {premiumFeatures.map((feature) => (
          <View key={feature} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontSize: 15 }}>{feature}</Text>
          </View>
        ))}

        {!isPremium && premiumReady && (
          <View style={{ marginTop: 24, gap: 12 }}>
            <Button title={t('subscription.getPremium')} onPress={handlePurchase} loading={purchasing} />
            <Button title={t('subscription.restore')} variant="ghost" onPress={handleRestore} loading={purchasing} />
          </View>
        )}

        {!isPremium && !premiumReady ? (
          <Card style={{ marginTop: 24, borderColor: colors.border, borderWidth: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
              {t('subscription.comingSoonTitle')}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20 }}>
              {t('subscription.comingSoonBody')}
            </Text>
          </Card>
        ) : null}

        <Card style={{ marginTop: 24 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>
            {t('subscription.paymentNotice')}
          </Text>
        </Card>
      </ScreenContainer>
    </View>
  );
}
