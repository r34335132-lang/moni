import type { Transaction } from '@/src/core/types/entities';
import {
  formatCurrency,
  formatDate,
  isExpenseType,
  isIncomeType,
  truncateText,
} from '@/src/core/utils/format';

export function buildDailySummaryBody(transactions: Transaction[], currency: string): string {
  if (!transactions.length) {
    return 'Aún no tienes movimientos hoy. Registra tus gastos e ingresos en MONI.';
  }

  const income = transactions
    .filter((t) => isIncomeType(t.type))
    .reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions
    .filter((t) => isExpenseType(t.type))
    .reduce((s, t) => s + Number(t.amount), 0);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime(),
  );

  const lines = sorted.slice(0, 8).map((tx) => {
    const sign = isIncomeType(tx.type) ? '+' : '-';
    const label =
      tx.description?.trim() ||
      tx.merchant?.trim() ||
      tx.category?.name ||
      (isIncomeType(tx.type) ? 'Ingreso' : 'Gasto');
    return `${sign}${formatCurrency(Number(tx.amount), currency)} · ${truncateText(label, 28)}`;
  });

  let body = `Ingresos ${formatCurrency(income, currency)} | Gastos ${formatCurrency(expenses, currency)}\n`;
  body += lines.join('\n');
  if (sorted.length > 8) {
    body += `\n… y ${sorted.length - 8} movimiento(s) más`;
  }
  return body;
}

export function buildDailySummaryTitle(count: number): string {
  return count > 0 ? `📊 Resumen del día (${count} movimientos)` : '📊 Resumen del día';
}
