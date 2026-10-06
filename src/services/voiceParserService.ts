import type { ParsedVoiceTransaction } from '@/src/core/types/entities';
import { parseAmount } from '@/src/core/utils/format';
import { detectPaymentMethod, suggestCategoryName } from '@/src/services/smartFillService';

const INCOME_KEYWORDS = [
  'cobré', 'cobre', 'recibí', 'recibi', 'ingreso', 'salario', 'sueldo',
  'pagaron', 'gané', 'gane', 'depositaron', 'me pagó', 'me pago', 'abonaron',
];
const EXPENSE_KEYWORDS = [
  'gasté', 'gaste', 'pagué', 'pague', 'compré', 'compre', 'gasto',
  'salió', 'salio', 'me cobraron', 'transferí', 'transferi',
];

const STOP_WORDS = new Set([
  'hoy', 'ayer', 'pesos', 'peso', 'efectivo', 'tarjeta', 'crédito', 'credito',
  'débito', 'debito', 'con', 'por', 'para', 'una', 'unos', 'unas', 'del', 'de',
]);

const MERCHANT_PATTERNS = [
  /(?:en|de|a)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ][\wÁÉÍÓÚÑáéíóúñ&.\s]{1,}?)(?:\s+(?:con|en|por|de|para|hoy|ayer)\b|\s*$)/i,
];

function detectType(text: string): 'income' | 'expense' {
  const lower = text.toLowerCase();
  if (INCOME_KEYWORDS.some((kw) => lower.includes(kw))) return 'income';
  if (EXPENSE_KEYWORDS.some((kw) => lower.includes(kw))) return 'expense';
  return 'expense';
}

function extractAmount(text: string): number | null {
  const normalized = text
    .replace(/(\d+)\s+con\s+(\d{1,2})\b/gi, '$1.$2')
    .replace(/(\d+)\s+punto\s+(\d{1,2})\b/gi, '$1.$2');

  const patterns = [
    /(\d+(?:[.,]\d{1,2})?)\s*(?:pesos|mxn|dlls|dólares|dolares|\$)/i,
    /\$\s*(\d+(?:[.,]\d{1,2})?)/,
    /(\d+(?:[.,]\d{1,2})?)/,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return parseAmount(match[1]);
  }
  return null;
}

function extractMerchant(text: string): string | null {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const merchant = match[1].trim().replace(/\s+/g, ' ');
      const first = merchant.split(' ')[0]?.toLowerCase() ?? '';
      if (merchant.length > 2 && !STOP_WORDS.has(first) && !STOP_WORDS.has(merchant.toLowerCase())) {
        return merchant.charAt(0).toUpperCase() + merchant.slice(1);
      }
    }
  }
  return null;
}

function extractDate(text: string): string {
  const lower = text.toLowerCase();
  const today = new Date();
  if (lower.includes('ayer')) today.setDate(today.getDate() - 1);
  return today.toISOString();
}

/** Prefer the longest / richest transcript among speech alternatives. */
export function pickBestTranscript(results: Array<{ transcript?: string } | undefined>): string {
  const candidates = results
    .map((r) => r?.transcript?.trim() ?? '')
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return candidates[0] ?? '';
}

export function parseVoiceTranscript(transcript: string): ParsedVoiceTransaction {
  const type = detectType(transcript);
  const merchant = extractMerchant(transcript);
  const hint = [transcript, merchant ?? ''].join(' ');
  return {
    amount: extractAmount(transcript),
    category: suggestCategoryName(hint, [], type),
    merchant,
    date: extractDate(transcript),
    description: transcript.trim(),
    type,
    paymentMethod: detectPaymentMethod(transcript),
  };
}
