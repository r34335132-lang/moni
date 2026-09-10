import { getDayOfYear } from 'date-fns';
import quotes from './motivationalQuotes.json';

export function getQuoteForDay(date: Date = new Date()): string {
  const dayIndex = (getDayOfYear(date) - 1) % quotes.length;
  return quotes[dayIndex] ?? quotes[0];
}

export function getQuoteForDayNumber(dayOfYear: number): string {
  const index = ((dayOfYear - 1) % quotes.length + quotes.length) % quotes.length;
  return quotes[index] ?? quotes[0];
}

export const TOTAL_QUOTES = quotes.length;
