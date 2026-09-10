import { format, parseISO, isValid } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import type { AppLocale } from '@/src/core/i18n/types';

export const INCOME_COLOR = '#15803D';
export const EXPENSE_COLOR = '#DC2626';

let currentLocale: AppLocale = 'es';

export function setFormatLocale(locale: AppLocale): void {
  currentLocale = locale;
}

export function getFormatLocale(): AppLocale {
  return currentLocale;
}

function intlLocale(): string {
  return currentLocale === 'en' ? 'en-US' : 'es-MX';
}

function dateFnsLocale() {
  return currentLocale === 'en' ? enUS : es;
}

export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Normaliza a 2 decimales sin redondear centavos de más. */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function formatDate(date: string | Date, pattern = 'd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, pattern, { locale: dateFnsLocale() });
}

export function formatShortDate(date: string | Date): string {
  return formatDate(date, 'd MMM');
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Parsea montos MX: $1,249.99 · 125,50 · 125.50 */
export function parseAmount(text: string): number | null {
  const raw = text.replace(/[^0-9.,]/g, '').trim();
  if (!raw) return null;

  let normalized = raw;
  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      normalized = raw.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = raw.replace(/,/g, '');
    }
  } else if (lastComma > -1) {
    const after = raw.length - lastComma - 1;
    normalized = after <= 2 ? raw.replace(',', '.') : raw.replace(/,/g, '');
  }

  const num = parseFloat(normalized);
  if (!Number.isFinite(num)) return null;
  return roundMoney(num);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

export function getMonthYear(date = new Date()): { month: number; year: number } {
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

/** Rango del mes en hora local (sin UTC) para no mezclar meses en reportes. */
export function getMonthDateRange(month: number, year: number) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = `${year}-${pad(month)}-01T00:00:00`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endBefore = `${nextYear}-${pad(nextMonth)}-01T00:00:00`;
  return { startDate, endBefore };
}

/** Rango del día en hora local; endBefore es exclusivo (medianoche del día siguiente). */
export function getDayDateRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const endBefore = new Date(start);
  endBefore.setDate(endBefore.getDate() + 1);
  return { startDate: start.toISOString(), endBefore: endBefore.toISOString() };
}

export function isIncomeType(type: string): boolean {
  return ['income', 'loan_requested', 'loan_collection'].includes(type);
}

export function isExpenseType(type: string): boolean {
  return ['expense', 'loan_payment', 'loan_granted'].includes(type);
}
