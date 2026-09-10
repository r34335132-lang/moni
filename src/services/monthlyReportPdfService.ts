import { Asset } from 'expo-asset';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import type { Transaction } from '@/src/core/types/entities';
import {
  formatCurrency,
  formatDate,
  getMonthDateRange,
  getMonthYear,
  isExpenseType,
  isIncomeType,
} from '@/src/core/utils/format';
import { transactionRepository } from '@/src/data/repositories/transactionRepository';
import { buildExpenseSlices } from '@/src/components/ExpenseDonutChart';

const LOGO = require('../../assets/images/icon.jpeg');

async function getLogoBase64(): Promise<string> {
  const asset = Asset.fromModule(LOGO);
  await asset.downloadAsync();
  if (!asset.localUri) return '';
  return FileSystem.readAsStringAsync(asset.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(params: {
  logoBase64: string;
  userName: string;
  monthLabel: string;
  currency: string;
  income: number;
  expenses: number;
  balance: number;
  transactions: Transaction[];
  categoryRows: Array<{ name: string; amount: number; color: string }>;
}): string {
  const { logoBase64, userName, monthLabel, currency, income, expenses, balance, transactions, categoryRows } =
    params;

  const txRows = transactions
    .map((tx) => {
      const isIncome = isIncomeType(tx.type);
      const sign = isIncome ? '+' : '-';
      const color = isIncome ? '#15803D' : '#DC2626';
      const label = escapeHtml(
        tx.description?.trim() || tx.merchant?.trim() || tx.category?.name || 'Movimiento',
      );
      const cat = escapeHtml(tx.category?.name ?? '—');
      const date = formatDate(tx.transaction_date, 'd MMM yyyy');
      return `<tr>
        <td>${date}</td>
        <td>${label}</td>
        <td>${cat}</td>
        <td style="color:${color};font-weight:700;text-align:right">${sign}${escapeHtml(formatCurrency(Number(tx.amount), currency))}</td>
      </tr>`;
    })
    .join('');

  const catHtml = categoryRows
    .map(
      (c) =>
        `<tr><td><span style="display:inline-block;width:10px;height:10px;background:${c.color};border-radius:50%;margin-right:6px"></span>${escapeHtml(c.name)}</td><td style="text-align:right;font-weight:600">${escapeHtml(formatCurrency(c.amount, currency))}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; color: #111; padding: 32px; font-size: 12px; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; border-bottom: 2px solid #22C55E; padding-bottom: 16px; }
    .logo { width: 64px; height: 64px; border-radius: 16px; object-fit: cover; }
    h1 { margin: 0; font-size: 22px; color: #166534; }
    .sub { color: #666; margin-top: 4px; }
    .stats { display: flex; gap: 12px; margin: 20px 0; }
    .stat { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid #e5e5e5; }
    .stat-label { font-size: 10px; color: #666; text-transform: uppercase; }
    .stat-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 8px 6px; border-bottom: 1px solid #eee; text-align: left; }
    th { background: #f5f5f5; font-size: 10px; text-transform: uppercase; color: #555; }
    h2 { font-size: 14px; margin: 24px 0 8px; color: #166534; }
    .footer { margin-top: 32px; text-align: center; color: #999; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img class="logo" src="data:image/jpeg;base64,${logoBase64}" alt="MONI"/>` : ''}
    <div>
      <h1>MONI — Reporte mensual</h1>
      <div class="sub">${escapeHtml(monthLabel)} · ${escapeHtml(userName)}</div>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-label">Ingresos</div><div class="stat-value" style="color:#15803D">+${escapeHtml(formatCurrency(income, currency))}</div></div>
    <div class="stat"><div class="stat-label">Gastos</div><div class="stat-value" style="color:#DC2626">-${escapeHtml(formatCurrency(expenses, currency))}</div></div>
    <div class="stat"><div class="stat-label">Balance</div><div class="stat-value" style="color:${balance >= 0 ? '#15803D' : '#DC2626'}">${balance >= 0 ? '+' : ''}${escapeHtml(formatCurrency(balance, currency))}</div></div>
  </div>

  <h2>Gastos por categoría</h2>
  <table>${catHtml || '<tr><td colspan="2">Sin gastos este mes</td></tr>'}</table>

  <h2>Todos los movimientos (${transactions.length})</h2>
  <table>
    <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Monto</th></tr></thead>
    <tbody>${txRows || '<tr><td colspan="4">Sin movimientos</td></tr>'}</tbody>
  </table>

  <div class="footer">Generado por MONI · ${escapeHtml(formatDate(new Date(), "d MMMM yyyy, HH:mm"))}</div>
</body>
</html>`;
}

export const monthlyReportPdfService = {
  async generateAndShare(userId: string, userName: string, currency: string, month?: number, year?: number) {
    const period = getMonthYear();
    const m = month ?? period.month;
    const y = year ?? period.year;
    const { startDate, endBefore } = getMonthDateRange(m, y);

    const allTransactions = await transactionRepository.getAll(userId, { startDate, endBefore });
    const transactions = allTransactions.filter((tx) => {
      const d = new Date(tx.transaction_date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
    const expenses = transactions.filter((t) => isExpenseType(t.type));
    const income = transactions
      .filter((t) => isIncomeType(t.type))
      .reduce((s, t) => s + Number(t.amount), 0);
    const expenseTotal = expenses.reduce((s, t) => s + Number(t.amount), 0);
    const slices = buildExpenseSlices(expenses);
    const logoBase64 = await getLogoBase64();
    const monthLabel = formatDate(new Date(y, m - 1, 1), 'MMMM yyyy');

    const html = buildHtml({
      logoBase64,
      userName,
      monthLabel,
      currency,
      income,
      expenses: expenseTotal,
      balance: income - expenseTotal,
      transactions,
      categoryRows: slices.map((s) => ({ name: s.name, amount: s.amount, color: s.color })),
    });

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const fileName = `MONI-reporte-${y}-${String(m).padStart(2, '0')}.pdf`;
    const dest = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.moveAsync({ from: uri, to: dest });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(dest, {
        mimeType: 'application/pdf',
        dialogTitle: 'Exportar reporte MONI',
        UTI: 'com.adobe.pdf',
      });
    }

    return dest;
  },
};
