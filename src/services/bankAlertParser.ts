import { detectPaymentMethod, suggestCategoryName } from '@/src/services/smartFillService';
import { detectWalletBrand, walletTags } from '@/src/services/walletAutoSave';
import { parseAmount, roundMoney } from '@/src/core/utils/format';

export interface ParsedBankAlert {
  amount: number;
  merchant: string | null;
  description: string;
  isWallet: boolean;
  walletBrand: 'apple_pay' | 'google_pay' | 'samsung_pay' | 'wallet' | null;
  suggestedCategory: string | null;
  rawText: string;
}

/**
 * Parsea avisos de banco / Wallet estilo MonAi:
 * "BBVA: Compra con Apple Pay por $89.00 en STARBUCKS"
 * "Nu: Compra aprobada de $120.00 en OXXO con Google Pay"
 */
export function parseBankAlert(text: string): ParsedBankAlert | null {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 8) return null;

  const amountMatch =
    cleaned.match(
      /(?:\$|mxn\s*|pesos?\s*)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i,
    ) ??
    cleaned.match(
      /(?:por|de|monto|cargo|compra)\s+(?:de\s+)?(?:\$)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i,
    );

  if (!amountMatch) return null;
  const amount = roundMoney(parseAmount(amountMatch[1]) ?? 0);
  if (amount <= 0) return null;

  const merchantMatch =
    cleaned.match(
      /\ben\s+([A-ZÁÉÍÓÚÑ0-9][A-ZÁÉÍÓÚÑa-záéíóúñ0-9 &.'*]{1,40}?)(?:\s*[.|,]|\s+disponible|\s+saldo|\s+con\s|\s*$)/i,
    ) ??
    cleaned.match(/\*\s*([A-Z0-9][A-Z0-9 &*]{2,30})/i);

  let merchant = merchantMatch?.[1]?.replace(/\s+/g, ' ').trim() ?? null;
  if (merchant) {
    merchant = merchant.replace(/\*+/g, '').replace(/\s+(disponible|saldo|mxn).*$/i, '').trim();
    if (merchant.length < 2) merchant = null;
  }

  const method = detectPaymentMethod(cleaned);
  const isWallet = method === 'wallet' || /apple\s*pay|google\s*pay|gpay|samsung\s*pay|wallet/i.test(cleaned);
  const walletBrand = isWallet ? detectWalletBrand(cleaned) : null;

  return {
    amount,
    merchant,
    description: cleaned.slice(0, 180),
    isWallet,
    walletBrand,
    suggestedCategory: suggestCategoryName(`${merchant ?? ''} ${cleaned}`, [], 'expense'),
    rawText: cleaned,
  };
}

export function bankAlertTags(parsed: ParsedBankAlert): string[] {
  const tags = ['bank_sync', 'source:bank_alert'];
  if (parsed.isWallet) {
    tags.push(...walletTags('wallet', parsed.rawText));
  }
  return [...new Set(tags)];
}

/** Fingerprint estable para evitar duplicados al pegar el mismo aviso. */
export function bankAlertFingerprint(parsed: ParsedBankAlert): string {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${day}|${parsed.amount}|${(parsed.merchant ?? '').toLowerCase()}|${parsed.walletBrand ?? ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return `alert_${Math.abs(hash).toString(36)}`;
}
