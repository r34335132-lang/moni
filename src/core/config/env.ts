export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  /** OCR.space key for ticket scanning. Falls back to their public demo key. */
  ocrSpaceKey: process.env.EXPO_PUBLIC_OCR_SPACE_KEY ?? 'helloworld',
} as const;

export function validateEnv(): void {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    console.warn('[MONI] Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
}
