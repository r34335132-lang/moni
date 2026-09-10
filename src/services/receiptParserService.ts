import type { ParsedReceiptData } from '@/src/core/types/entities';
import { env } from '@/src/core/config/env';
import { parseAmount } from '@/src/core/utils/format';
import { logger } from '@/src/core/utils/logger';
import { detectPaymentMethod } from '@/src/services/smartFillService';

const MERCHANT_PATTERNS = [
  /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s&.]{2,})/m,
  /(?:TIENDA|STORE|COMERCIO|RAZON SOCIAL|RAZÓN SOCIAL)[:\s]+(.+)/i,
];

const TOTAL_PATTERNS = [
  /(?:TOTAL\s*(?:A\s*PAGAR)?|TOT|IMPORTE|AMOUNT|GRAN\s*TOTAL)[:\s]*\$?\s*(\d+(?:[.,]\d{2})?)/i,
  /(?:TOTAL|TOT)[:\s]*(\d+(?:[.,]\d{2})?)/i,
  /\$\s*(\d+(?:[.,]\d{2})?)\s*$/,
];

const DATE_PATTERNS = [
  /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
  /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
];

const ITEM_PATTERN = /^(.+?)\s+\$?\s*(\d+(?:[.,]\d{2})?)\s*$/;

function emptyReceipt(rawText = ''): ParsedReceiptData {
  return {
    merchant: null,
    total: null,
    date: new Date().toISOString(),
    currency: 'MXN',
    items: [],
    paymentMethod: null,
    rawText,
  };
}

function extractMerchant(text: string): string | null {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  const firstLine = text.split('\n').map((l) => l.trim()).find((l) => l.length > 2);
  return firstLine ?? null;
}

function extractTotal(text: string): number | null {
  for (const pattern of TOTAL_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return parseAmount(match[1]);
  }
  const amounts = text.match(/\d+(?:[.,]\d{2})?/g);
  if (amounts?.length) {
    const nums = amounts.map((a) => parseAmount(a)).filter((n): n is number => n !== null);
    return nums.length ? Math.max(...nums) : null;
  }
  return null;
}

function extractDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }
  return new Date().toISOString();
}

function extractItems(text: string): Array<{ name: string; price: number }> {
  const items: Array<{ name: string; price: number }> = [];
  for (const line of text.split('\n')) {
    const match = line.trim().match(ITEM_PATTERN);
    if (match) {
      const price = parseAmount(match[2]);
      if (price && price > 0 && price < 100000) {
        items.push({ name: match[1].trim(), price });
      }
    }
  }
  return items;
}

async function ocrImageBase64(base64: string): Promise<string | null> {
  const apiKey = env.ocrSpaceKey;
  if (!apiKey) return null;

  const body = new FormData();
  body.append('apikey', apiKey);
  body.append('language', 'spa');
  body.append('isOverlayRequired', 'false');
  body.append('OCREngine', '2');
  body.append('scale', 'true');
  body.append('detectOrientation', 'true');
  body.append('base64Image', `data:image/jpeg;base64,${base64}`);

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body,
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    ParsedResults?: Array<{ ParsedText?: string }>;
    IsErroredOnProcessing?: boolean;
    ErrorMessage?: string | string[];
  };
  if (json.IsErroredOnProcessing) {
    logger.warn('ReceiptOCR', 'OCR error', { message: json.ErrorMessage });
    return null;
  }
  const text = json.ParsedResults?.[0]?.ParsedText?.trim();
  return text || null;
}

export function parseReceiptText(ocrText: string): ParsedReceiptData {
  return {
    merchant: extractMerchant(ocrText),
    total: extractTotal(ocrText),
    date: extractDate(ocrText),
    currency: 'MXN',
    items: extractItems(ocrText),
    paymentMethod: detectPaymentMethod(ocrText),
    rawText: ocrText,
  };
}

export async function parseReceiptFromImage(
  _imageUri: string,
  base64?: string | null,
): Promise<ParsedReceiptData> {
  try {
    if (!base64) return emptyReceipt();
    const text = await ocrImageBase64(base64);
    if (!text) return emptyReceipt();
    return parseReceiptText(text);
  } catch (error) {
    logger.warn('ReceiptOCR', 'Failed to parse receipt image', { error });
    return emptyReceipt();
  }
}
