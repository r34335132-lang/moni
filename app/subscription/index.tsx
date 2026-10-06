import React, { useEffect, useState } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { AppText, Font } from '@/src/components/ui/AppText';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { subscriptionService } from '@/src/services/subscriptionService';
import { getErrorMessage } from '@/src/core/utils/errors';

/**
 * Premium is sold only via store In-App Purchases (RevenueCat → App Store / Google Play).
 * Never collect card numbers or payment forms inside the app.
 */
export default function SubscriptionScreen() {
  const { user, isPremium, refreshProfile } = useAuth();
  const { colors, isDark } = useTheme();
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
        <AnimatedIn>
          <View
            style={{
              alignItems: 'center',
              marginBottom: 22,
              backgroundColor: colors.card,
              borderRadius: 28,
              paddingVertical: 28,
              paddingHorizontal: 20,
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.28 : 0.06,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 3,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Ionicons name="diamond" size={32} color={colors.primary} />
            </View>
            <AppText style={{ fontFamily: Font.bold, fontSize: 24, letterSpacing: -0.4, textAlign: 'center' }}>
              {isPremium
                ? t('subscription.active')
                : premiumReady
                  ? t('subscription.unlock')
                  : t('subscription.comingSoonTitle')}
            </AppText>
          </View>
        </AnimatedIn>

        <AnimatedIn index={1}>
          <Card style={{ marginBottom: 16 }} padding={18}>
            {premiumFeatures.map((feature, i) => (
              <View
                key={feature}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: i === premiumFeatures.length - 1 ? 0 : 14,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                </View>
                <AppText style={{ flex: 1, fontSize: 15, fontFamily: Font.medium }}>{feature}</AppText>
              </View>
            ))}
          </Card>
        </AnimatedIn>

        <AnimatedIn index={2}>
          <Card style={{ marginBottom: 12 }} padding={16}>
            <AppText style={{ fontFamily: Font.bold, fontSize: 15, marginBottom: 6 }}>
              {t('subscription.iapOnlyTitle')}
            </AppText>
            <AppText style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>
              {t('subscription.iapOnlyBody')}
            </AppText>
          </Card>
        </AnimatedIn>

        {!isPremium && premiumReady ? (
          <AnimatedIn index={3}>
            <View style={{ marginTop: 8, gap: 10 }}>
              <Button title={t('subscription.getPremium')} onPress={handlePurchase} loading={purchasing} />
              <Button title={t('subscription.restore')} variant="ghost" onPress={handleRestore} loading={purchasing} />
            </View>
          </AnimatedIn>
        ) : null}

        {!isPremium && !premiumReady ? (
          <AnimatedIn index={3}>
            <Card style={{ marginTop: 8 }} padding={16}>
              <AppText style={{ fontFamily: Font.bold, fontSize: 16, marginBottom: 8 }}>
                {t('subscription.comingSoonTitle')}
              </AppText>
              <AppText style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20 }}>
                {t('subscription.comingSoonBody')}
              </AppText>
            </Card>
          </AnimatedIn>
        ) : null}

        <AnimatedIn index={4}>
          <Card style={{ marginTop: 18 }} padding={16}>
            <AppText style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>
              {t('subscription.paymentNotice')}
            </AppText>
          </Card>
        </AnimatedIn>
      </ScreenContainer>
    </View>
  );
}
