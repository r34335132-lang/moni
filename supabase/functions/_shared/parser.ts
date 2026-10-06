import { suggestCategoryName } from './categoryRules.ts';

export type TxType = 'income' | 'expense';

export interface ParsedMovement {
  type: TxType;
  amount: number | null;
  merchant: string | null;
  description: string;
  categoryName: string | null;
  ambiguousType: boolean;
}

const INCOME_KEYWORDS = [
  'cobré', 'cobre', 'recibí', 'recibi', 'ingreso', 'salario', 'sueldo',
  'pagaron', 'gané', 'gane', 'depositaron', 'me pagó', 'me pago', 'abonaron',
  'i earned', 'i received', 'received', 'got paid', 'salary', 'paycheck',
  'income', 'deposit', 'deposited', 'freelance payment',
];
const EXPENSE_KEYWORDS = [
  'gasté', 'gaste', 'pagué', 'pague', 'compré', 'compre', 'gasto',
  'salió', 'salio', 'me cobraron', 'transferí', 'transferi',
  'i spent', 'i paid', 'i bought', 'spent', 'paid', 'bought', 'expense',
  'charged', 'purchase', 'purchased',
];

const SAVINGS_KEYWORDS = [
  'ahorré', 'ahorre', 'ahorro', 'meta de ahorro', 'para mi meta', 'a mi meta',
  'saving', 'savings', 'savings goal', 'to my goal', 'into savings',
];

const STOP_WORDS = new Set([
  'hoy', 'ayer', 'pesos', 'peso', 'efectivo', 'tarjeta', 'con', 'por', 'para',
  'una', 'unos', 'unas', 'del', 'de', 'el', 'la', 'los', 'las',
  'today', 'yesterday', 'cash', 'card', 'with', 'for', 'the', 'a', 'an', 'at', 'from',
]);

/** Number with optional thousands separators: 1,400 · 1.400 · 1,400.50 · 1.400,50 · 80 · 12.5 */
const NUM = String.raw`\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?`;
const NUM_GLOBAL = new RegExp(NUM, 'g');

/** The last separator is decimal only if 1–2 digits follow it; with 3 digits it's a thousands separator. */
function parseAmount(raw: string): number | null {
  let s = raw.replace(/[^\d.,]/g, '');
  const lastSep = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
  if (lastSep >= 0) {
    const decimals = s.length - lastSep - 1;
    if (decimals === 1 || decimals === 2) {
      s = `${s.slice(0, lastSep).replace(/[.,]/g, '')}.${s.slice(lastSep + 1)}`;
    } else {
      s = s.replace(/[.,]/g, '');
    }
  }
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function amountsIn(text: string): number[] {
  return (text.match(NUM_GLOBAL) ?? []).map(parseAmount).filter((n): n is number => n != null);
}

function detectType(text: string): { type: TxType; ambiguous: boolean } {
  const lower = text.toLowerCase();
  const income = INCOME_KEYWORDS.some((kw) => lower.includes(kw));
  const expense = EXPENSE_KEYWORDS.some((kw) => lower.includes(kw));
  if (income && !expense) return { type: 'income', ambiguous: false };
  if (expense && !income) return { type: 'expense', ambiguous: false };
  if (income && expense) return { type: 'expense', ambiguous: true };
  if (/\d/.test(text) && !income && !expense) return { type: 'expense', ambiguous: true };
  return { type: 'expense', ambiguous: false };
}

function extractAmount(text: string): number | null {
  const normalized = text
    .replace(/(\d+)\s+con\s+(\d{1,2})\b/gi, '$1.$2')
    .replace(/(\d+)\s+punto\s+(\d{1,2})\b/gi, '$1.$2')
    .replace(/(\d+)\s+point\s+(\d{1,2})\b/gi, '$1.$2');
  const patterns = [
    new RegExp(`(${NUM})\\s*(?:pesos|mxn|dlls|dólares|dolares|dollars|usd|\\$)`, 'i'),
    new RegExp(`\\$\\s*(${NUM})`),
    new RegExp(`(${NUM})`),
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return parseAmount(match[1]);
  }
  return null;
}

function extractMerchant(text: string): string | null {
  const patterns = [
    /(?:en|de|a|at|from|to)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ][\wÁÉÍÓÚÑáéíóúñ&.\s]{1,}?)(?:\s+(?:con|en|por|de|para|hoy|ayer|with|for|today|yesterday|on)\b|\s*$)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const merchant = match[1].trim().replace(/\s+/g, ' ');
      const first = merchant.split(' ')[0]?.toLowerCase() ?? '';
      if (merchant.length > 2 && !STOP_WORDS.has(first)) {
        return merchant.charAt(0).toUpperCase() + merchant.slice(1);
      }
    }
  }
  return null;
}

export function looksLikeSavings(text: string): boolean {
  const lower = text.toLowerCase();
  return SAVINGS_KEYWORDS.some((kw) => lower.includes(kw));
}

export function parseMovementText(text: string): ParsedMovement {
  const { type, ambiguous } = detectType(text);
  const merchant = extractMerchant(text);
  const hint = [text, merchant ?? ''].join(' ');
  return {
    type,
    amount: extractAmount(text),
    merchant,
    description: text.trim(),
    categoryName: suggestCategoryName(hint, [], type),
    ambiguousType: ambiguous,
  };
}

export function parseMoney(raw: string | number | null | undefined): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? Math.round(raw * 100) / 100 : null;
  if (!raw) return null;
  const m = String(raw).match(NUM_GLOBAL);
  return m ? parseAmount(m[m.length - 1]) : null;
}

// Letter lookarounds instead of \b so "TOTAL$1,400.00" and "TOTAL1,400.00" match but "Totalplay" doesn't.
const W = (s: string) => new RegExp(`(?<![A-ZÁÉÍÓÚÑ])(?:${s})(?![A-ZÁÉÍÓÚÑ])`, 'i');
const TOTAL_LABEL = W(String.raw`T[O0]TAL|A\s*PAGAR|AMOUNT\s*DUE`);
/** Labels that name the final amount unambiguously. */
const STRONG_TOTAL = W(String.raw`GRAN\s*T[O0]TAL|GRAND\s*T[O0]TAL|T[O0]TAL\s*A\s*PAGAR|NETO\s*A\s*PAGAR|IMPORTE\s*T[O0]TAL|T[O0]TAL\s*(?:M\.?\s*N\.?|MXN|NETO|VENTA)|VENTA\s*T[O0]TAL|AMOUNT\s*DUE`);
/** "TOTAL" lines that are not the amount paid. */
const NOT_TOTAL = W(String.raw`SUB\s*-?\s*T[O0]TAL|IVA(?!\s*INCL)|I\.V\.A\.?|IEPS|IMPUESTOS?|DESCUENTOS?|DESC|AHORR\w*|PUNTOS|CAMBIO|MONEDERO|PROPINA\s*SUGERIDA|DONATIVO|REDONDEO`);
/** "TOTAL ARTICULOS: 5" is a count unless the line also carries a price with cents. */
const COUNT_WORDS = W(String.raw`ART[IÍ]CULOS?|ITEMS?|PIEZAS?|PZAS?|PRODUCTOS?|UNIDADES`);
const TENDER_LINE = W(String.raw`EFECTIVO|RECIBIDO|SU\s*PAGO|PAGO\s*CON|CASH|TENDERED`);
const CHANGE_LINE = W(String.raw`CAMBIO|CHANGE`);

type MoneyToken = { value: number; cents: boolean };

function moneyTokens(line: string): MoneyToken[] {
  return (line.match(NUM_GLOBAL) ?? [])
    .map((tok) => ({ value: parseAmount(tok), cents: /[.,]\d{2}$/.test(tok) }))
    .filter((t): t is MoneyToken => t.value != null);
}

/** Rightmost amount on the line, or on the next line when that line is just a number (label/value split). */
function lineAmount(lines: string[], i: number): MoneyToken | null {
  // OCR sometimes prints thousands with a space: "TOTAL 1 400.00".
  const own = moneyTokens(lines[i].replace(/(\d{1,3})\s(\d{3}[.,]\d{2})(?!\d)/g, '$1$2'));
  if (own.length) return own[own.length - 1];
  const next = lines[i + 1] ?? '';
  if (/^[\s$]*[\d.,]+\s*(?:MXN|M\.?N\.?)?\s*$/i.test(next)) {
    const t = moneyTokens(next);
    return t[t.length - 1] ?? null;
  }
  return null;
}

function receiptTotal(ocrText: string): number | null {
  const lines = ocrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const strong: number[] = [];
  const plain: number[] = [];
  let tendered: number | null = null;
  let change: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (CHANGE_LINE.test(line)) change = lineAmount(lines, i)?.value ?? change;
    else if (TENDER_LINE.test(line) && !TOTAL_LABEL.test(line)) tendered = lineAmount(lines, i)?.value ?? tendered;

    if (!TOTAL_LABEL.test(line) || NOT_TOTAL.test(line)) continue;
    const amount = lineAmount(lines, i);
    if (!amount || (COUNT_WORDS.test(line) && !amount.cents)) continue;
    (STRONG_TOTAL.test(line) ? strong : plain).push(amount.value);
  }

  if (strong.length) return Math.max(...strong);
  if (plain.length) return Math.max(...plain);
  if (tendered != null && change != null && tendered > change) return Math.round((tendered - change) * 100) / 100;

  // No TOTAL label: only money-looking numbers (cents or $), skipping cash handed over and change.
  const moneyLike = lines
    .filter((l) => !TENDER_LINE.test(l) && !CHANGE_LINE.test(l))
    .flatMap((l) => (l.match(new RegExp(`\\$\\s*(?:${NUM})|(?:${NUM})(?=\\s|$)`, 'g')) ?? []))
    .filter((tok) => tok.includes('$') || /[.,]\d{2}$/.test(tok))
    .map(parseAmount)
    .filter((n): n is number => n != null);
  return moneyLike.length ? Math.max(...moneyLike) : null;
}

export function parseReceiptOcr(ocrText: string): ParsedMovement {
  const amount = receiptTotal(ocrText);

  const firstLine = ocrText.split('\n').map((l) => l.trim()).find((l) => l.length > 2) ?? null;
  const merchantMatch = ocrText.match(/(?:TIENDA|STORE|COMERCIO|RAZON SOCIAL|RAZÓN SOCIAL|MERCHANT)[:\s]+(.+)/i);
  const merchant = merchantMatch?.[1]?.trim() ?? firstLine;

  return {
    type: 'expense',
    amount,
    merchant,
    // Not the OCR dump: it becomes the transaction description and would skew language detection.
    description: merchant ? `Ticket ${merchant}` : 'Ticket',
    categoryName: suggestCategoryName([ocrText, merchant ?? ''].join(' '), [], 'expense'),
    ambiguousType: false,
  };
}

export function formatMoney(amount: number | null, currency = 'MXN', locale: 'es' | 'en' = 'es'): string {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-MX', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function isAffirmative(text: string): boolean {
  const t = text.trim().toLowerCase();
  return /^(sí|si|yes|yep|yeah|ok|okay|dale|confirmo|guardar|guárdalo|guardalo|save|confirm|👍|✅)$/i.test(t)
    || t === 's'
    || t === 'y';
}

export function isNegative(text: string): boolean {
  const t = text.trim().toLowerCase();
  return /^(no|nop|nope|cancel|cancelar|descartar|discard|❌|👎)$/i.test(t)
    || t === 'n';
}

export function isTermsAccept(text: string): boolean {
  const t = text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.!]+$/, '');
  return /^(acepto|aceptar|si acepto|acepto los terminos|de acuerdo|accept|i accept|agree|i agree)$/.test(t)
    || isAffirmative(text);
}

export function isEdit(text: string): boolean {
  const t = text.trim().toLowerCase();
  return /^(editar|edit|cambiar|corrige|corregir|change|fix)$/i.test(t);
}

export function parseLinkCode(text: string): string | null {
  const m = text.trim().match(/^(?:vincular|link|conectar|connect)\s+(\d{6})$/i);
  return m?.[1] ?? null;
}

export function parseTypeChoice(text: string): TxType | null {
  const t = text.trim().toLowerCase();
  if (/^(gasto|expense|egreso)$/i.test(t)) return 'expense';
  if (/^(ingreso|income|entrada)$/i.test(t)) return 'income';
  return null;
}

export interface AccountOption {
  id: string;
  name: string;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Account mentioned inside a movement, e.g. "Gasté 80 en Uber con BBVA". Whole-word match, longest name wins. */
export function findAccountInText<T extends AccountOption>(text: string, accounts: T[]): T | null {
  const haystack = normalize(text);
  let best: T | null = null;
  for (const account of accounts) {
    const name = normalize(account.name);
    if (!name) continue;
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(name)}($|[^a-z0-9])`);
    if (re.test(haystack) && (!best || name.length > normalize(best.name).length)) {
      best = account;
    }
  }
  return best;
}

/** Reply while confirming: "2", "BBVA", "con Nu", "cuenta Banorte". */
export function parseAccountChoice<T extends AccountOption>(text: string, accounts: T[]): T | null {
  const t = normalize(text).replace(/[.!?]+$/, '');
  const num = t.match(/^#?(\d{1,2})$/);
  if (num) {
    const idx = Number(num[1]) - 1;
    return accounts[idx] ?? null;
  }
  const stripped = t
    .replace(/^(la\s+|el\s+)?(cuenta|con|de|desde|en|tarjeta|account|with|from|card)\s+/, '')
    .trim();
  return accounts.find((a) => normalize(a.name) === stripped) ?? null;
}

/** "4 si", "sí 4", "Banorte sí", "2, ok": pick account and confirm in one message. */
export function parseAccountAndConfirm<T extends AccountOption>(text: string, accounts: T[]): T | null {
  const tokens = text.trim().split(/[\s,;]+/).filter(Boolean);
  if (tokens.length < 2) return null;
  const rest = tokens.filter((tok) => !isAffirmative(tok.replace(/[.!]+$/, '')));
  if (rest.length === tokens.length || !rest.length) return null;
  return parseAccountChoice(rest.join(' '), accounts);
}

export function isBareNumber(text: string): boolean {
  return /^#?\d{1,2}[.!]?$/.test(text.trim());
}

export type BotCommand = 'balance' | 'report' | 'help';

export function parseBotCommand(text: string): BotCommand | null {
  const t = text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (
    /^(saldo|balance|cuanto tengo|mi saldo|my balance|how much do i have|whats my balance|what is my balance)[!?.]*$/i
      .test(t)
  ) {
    return 'balance';
  }
  if (
    /^(resumen|reporte|report|summary|mes|mi mes|estado de cuenta|monthly report|this month)[!?.]*$/i.test(t)
    || /^(resumen|reporte|report|summary)\s+(del\s+)?(mes|month)[!?.]*$/i.test(t)
  ) {
    return 'report';
  }
  if (/^(ayuda|help|menu|comandos|inicio|hola|hi|hello|commands|start)[!?.]*$/i.test(t)) {
    return 'help';
  }
  return null;
}
