import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import { supabase } from '@/src/data/supabase/client';
import { env } from '@/src/core/config/env';
import { handleSupabaseError } from '@/src/core/utils/errors';
import { logger } from '@/src/core/utils/logger';

const PREMIUM_ENTITLEMENT = 'premium';

export const subscriptionService = {
  isConfigured() {
    return Boolean(env.revenueCatIosKey && env.revenueCatAndroidKey);
  },

  async configure(userId: string) {
    if (!this.isConfigured()) {
      logger.warn('Subscription', 'RevenueCat API keys not fully configured');
      return;
    }
    const apiKey = Platform.OS === 'ios' ? env.revenueCatIosKey : env.revenueCatAndroidKey;
    if (!apiKey) {
      logger.warn('Subscription', 'RevenueCat API key not configured');
      return;
    }
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    await Purchases.configure({ apiKey, appUserID: userId });
  },

  async checkPremiumStatus(): Promise<boolean> {
    try {
      const info: CustomerInfo = await Purchases.getCustomerInfo();
      return info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
    } catch {
      return false;
    }
  },

  async getOfferings() {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  },

  async purchasePackage(packageToPurchase: Parameters<typeof Purchases.purchasePackage>[0]) {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
  },

  async restorePurchases(): Promise<boolean> {
    const info = await Purchases.restorePurchases();
    return info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
  },

  async syncSubscription(userId: string, isPremium: boolean, productId?: string) {
    if (isPremium) {
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        product_id: productId ?? 'moni_premium_monthly',
        status: 'active',
        purchase_date: new Date().toISOString(),
        expiration_date: null,
      }, { onConflict: 'user_id' });

      if (error) handleSupabaseError(error);
      await supabase.from('profiles').update({ is_premium: true }).eq('id', userId);
    }
  },
};
