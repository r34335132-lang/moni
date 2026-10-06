import type { Account, Category } from '@/src/core/types/entities';
import {
  type CategoryKind,
  fallbackCategory,
  normalizeText,
  pickCategory,
  suggestCategoryName as suggestFromRules,
} from '@/supabase/functions/_shared/categoryRules';

export type PaymentMethod = 'cash' | 'card' | 'wallet';

const CASH_KEYWORDS = [
  'efectivo', 'cash', 'billete', 'monedas', 'en mano', 'pago en efectivo',
  'recibido', 'cambio $', 'cambio:',
];
const WALLET_KEYWORDS = [
  'apple pay', 'applepay', 'google pay', 'googlepay', 'gpay', 'samsung pay', 'samsungpay',
  'wallet pay', 'pago con wallet', 'wallet', 'contactless', 'sin contacto', 'tap to pay',
  'pago con apple', 'pago con google',
];
const CARD_KEYWORDS = [
  'tarjeta', 'crédito', 'credito', 'débito', 'debito', 'tdc', 'visa', 'mastercard',
  'amex', 'american express', 'clip', 'terminal', 'banco', '****', 'xxxx',
  'pago con tarjeta', 'terminación', 'terminacion',
];

export function detectPaymentMethod(text: string): PaymentMethod | null {
  const lower = text.toLowerCase();
  if (CASH_KEYWORDS.some((kw) => lower.includes(kw))) return 'cash';
  if (WALLET_KEYWORDS.some((kw) => lower.includes(kw))) return 'wallet';
  if (CARD_KEYWORDS.some((kw) => lower.includes(kw))) return 'card';
  return null;
}

export function suggestCategoryName(
  text: string,
  categories: { name: string; type?: string | null; user_id?: string | null }[] = [],
  kind?: CategoryKind,
): string | null {
  return suggestFromRules(text, categories, kind);
}

export function matchCategoryId(name: string | null, categories: Category[], kind?: CategoryKind): string | null {
  if (!name || !categories.length) return null;
  const needle = normalizeText(name);
  const exact = categories.find((c) => normalizeText(c.name) === needle);
  if (exact) return exact.id;
  // e.g. a "Deportes" suggestion for a user without that category resolves to Salud.
  return pickCategory(name, categories, kind)?.id ?? null;
}

/** "Otros" rather than whatever category happens to be first in the list. */
export function fallbackCategoryId(categories: Category[], kind?: CategoryKind): string | null {
  return fallbackCategory(categories, kind)?.id
    ?? categories.find((c) => !kind || c.type === kind || c.type === 'both')?.id
    ?? categories[0]?.id
    ?? null;
}

export function suggestAccountId(
  accounts: Account[],
  method: PaymentMethod | null,
  text = '',
): string | null {
  if (!accounts.length) return null;
  const lower = text.toLowerCase();

  const byName = accounts.find((a) => lower.includes(a.name.toLowerCase()) && a.name.length > 2);
  if (byName) return byName.id;

  if (method === 'cash') {
    return (
      accounts.find((a) => a.type === 'cash')?.id ??
      accounts.find((a) => a.name.toLowerCase().includes('efectivo'))?.id ??
      accounts[0].id
    );
  }

  if (method === 'card' || method === 'wallet') {
    return (
      accounts.find((a) => a.type === 'credit')?.id ??
      accounts.find((a) => a.type === 'bank')?.id ??
      accounts.find((a) => /tarjeta|crédito|credito|débito|debito|banco/i.test(a.name))?.id ??
      accounts.find((a) => a.type !== 'cash')?.id ??
      accounts[0].id
    );
  }

  return accounts.find((a) => a.is_default)?.id ?? accounts[0].id;
}

export function accountMethod(account: Account): PaymentMethod {
  if (account.type === 'cash' || account.name.toLowerCase().includes('efectivo')) return 'cash';
  return 'card';
}
