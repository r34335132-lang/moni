import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PaymentMethod } from '@/src/services/smartFillService';

const STORAGE_KEY = 'moni_wallet_auto_save';

/** Preferencia: auto-guardar pagos detectados como billetera (default: sí). */
export async function isWalletAutoSaveEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null) return true;
    return raw !== '0';
  } catch {
    return true;
  }
}

export async function setWalletAutoSaveEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}

export function walletPlatformLabel(): string {
  return 'Billetera';
}

export function detectWalletBrand(text: string): 'apple_pay' | 'google_pay' | 'samsung_pay' | 'wallet' {
  const lower = text.toLowerCase();
  if (/apple\s*pay|applepay/.test(lower)) return 'apple_pay';
  if (/google\s*pay|googlepay|\bgpay\b/.test(lower)) return 'google_pay';
  if (/samsung\s*pay|samsungpay/.test(lower)) return 'samsung_pay';
  return 'wallet';
}

export function walletTags(method: PaymentMethod | null, text = ''): string[] {
  if (method !== 'wallet') return [];
  const brand = detectWalletBrand(text);
  return brand === 'wallet' ? ['wallet'] : ['wallet', brand];
}

export function walletMethodLabel(
  method: PaymentMethod | null,
  _text: string,
  labels: { cash: string; card: string; wallet: string; applePay?: string; googlePay?: string },
): string | null {
  if (method === 'cash') return labels.cash;
  if (method === 'card') return labels.card;
  if (method === 'wallet') return labels.wallet;
  return null;
}
