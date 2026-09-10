import type { ParsedVoiceTransaction } from '@/src/core/types/entities';
import { parseAmount } from '@/src/core/utils/format';
import { detectPaymentMethod, suggestCategoryName } from '@/src/services/smartFillService';

const INCOME_KEYWORDS = ['cobré', 'recibí', 'ingreso', 'salario', 'sueldo', 'pagaron', 'gané', 'depositaron', 'me pagó', 'me pago'];
const EXPENSE_KEYWORDS = ['gasté', 'pagué', 'compré', 'gasto', 'salió', 'me cobraron'];

const MERCHANT_PATTERNS = [
  /(?:en|de|a)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s]+?)(?:\s+en|\s+por|\s+con|\s+de|\s*$)/i,
  /(?:en|de)\s+(\w+)/i,
];

function detectType(text: string): 'income' | 'expense' {
  const lower = text.toLowerCase();
  if (INCOME_KEYWORDS.some((kw) => lower.includes(kw))) return 'income';
  if (EXPENSE_KEYWORDS.some((kw) => lower.includes(kw))) return 'expense';
  return 'expense';
}

function extractAmount(text: string): number | null {
  const patterns = [
    /(\d+(?:[.,]\d{1,2})?)\s*(?:pesos|mxn|dlls|dólares|\$)/i,
    /\$\s*(\d+(?:[.,]\d{1,2})?)/,
    /(\d+(?:[.,]\d{1,2})?)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseAmount(match[1]);
  }
  return null;
}

function extractMerchant(text: string): string | null {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const merchant = match[1].trim();
      if (merchant.length > 2 && !['hoy', 'ayer', 'pesos', 'efectivo', 'tarjeta'].includes(merchant.toLowerCase())) {
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

export function parseVoiceTranscript(transcript: string): ParsedVoiceTransaction {
  const type = detectType(transcript);
  const merchant = extractMerchant(transcript);
  const hint = [transcript, merchant ?? ''].join(' ');
  return {
    amount: extractAmount(transcript),
    category: suggestCategoryName(hint),
    merchant,
    date: extractDate(transcript),
    description: transcript.trim(),
    type,
    paymentMethod: detectPaymentMethod(transcript),
  };
}
