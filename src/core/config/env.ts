export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  /** OCR.space key for ticket scanning. Falls back to their public demo key. */
  ocrSpaceKey: process.env.EXPO_PUBLIC_OCR_SPACE_KEY ?? 'helloworld',
  /** Número Business de WhatsApp (E.164 o display). */
  whatsappBusinessNumber: process.env.EXPO_PUBLIC_WHATSAPP_BUSINESS_NUMBER || '+526145466940',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? '',
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL || process.env.EXPO_PUBLIC_TERMS_URL || '',
  /** Keep in sync with the bot's MONI_TERMS_VERSION secret. */
  termsVersion: process.env.EXPO_PUBLIC_TERMS_VERSION || '2026-09',
} as const;

export function validateEnv(): void {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    console.warn('[MONI] Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
}
