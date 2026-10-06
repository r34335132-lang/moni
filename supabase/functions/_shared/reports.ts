import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { formatMoney } from './parser.ts';
import type { BotLocale } from './i18n.ts';

const INCOME_TYPES = new Set(['income', 'loan_requested', 'loan_collection']);
const EXPENSE_TYPES = new Set(['expense', 'loan_payment', 'loan_granted']);

function monthRange(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = `${year}-${pad(month)}-01T00:00:00`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endBefore = `${nextYear}-${pad(nextMonth)}-01T00:00:00`;
  return { year, month, startDate, endBefore };
}

function monthLabel(year: number, month: number, locale: BotLocale): string {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-MX', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, 1));
  } catch {
    return `${month}/${year}`;
  }
}

export async function buildBalanceMessage(
  supabase: SupabaseClient,
  userId: string,
  currency: string,
  locale: BotLocale = 'es',
): Promise<string> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('name, balance, type, is_default')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false });

  if (error) {
    console.error('balance accounts', error);
    return locale === 'en'
      ? 'Couldn\'t load your accounts. Try again.'
      : 'No pude consultar tus cuentas. Intenta de nuevo.';
  }
  if (!accounts?.length) {
    return locale === 'en'
      ? 'You have no accounts in MONI. Create one in Profile → Accounts.'
      : 'No tienes cuentas en MONI. Crea una en Perfil → Cuentas.';
  }

  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const lines = accounts.map((a) => {
    const flag = a.is_default ? ' ★' : '';
    return `• ${a.name}${flag}: ${formatMoney(Number(a.balance), currency, locale)}`;
  });

  if (locale === 'en') {
    return [
      `💰 *Your MONI balance*`,
      ``,
      `*Total:* ${formatMoney(total, currency, locale)}`,
      ``,
      ...lines,
      ``,
      `_★ = primary account_`,
    ].join('\n');
  }

  return [
    `💰 *Tu saldo en MONI*`,
    ``,
    `*Total:* ${formatMoney(total, currency, locale)}`,
    ``,
    ...lines,
    ``,
    `_★ = cuenta principal_`,
  ].join('\n');
}

export async function buildMonthlyReportMessage(
  supabase: SupabaseClient,
  userId: string,
  currency: string,
  locale: BotLocale = 'es',
): Promise<string> {
  const { year, month, startDate, endBefore } = monthRange();
  const label = monthLabel(year, month, locale);

  const [{ data: accounts }, { data: txs, error: txError }] = await Promise.all([
    supabase
      .from('accounts')
      .select('balance')
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('transactions')
      .select('type, amount, merchant, description, category_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('transaction_date', startDate)
      .lt('transaction_date', endBefore)
      .order('transaction_date', { ascending: false })
      .limit(200),
  ]);

  if (txError) {
    console.error('report txs', txError);
    return locale === 'en'
      ? 'Couldn\'t build the report. Try again.'
      : 'No pude armar el reporte. Intenta de nuevo.';
  }

  const list = txs ?? [];
  const categoryIds = [...new Set(list.map((t) => t.category_id).filter(Boolean))] as string[];
  const categoryNames = new Map<string, string>();
  if (categoryIds.length) {
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);
    for (const c of cats ?? []) categoryNames.set(c.id, c.name);
  }

  let income = 0;
  let expenses = 0;
  const byCategory = new Map<string, number>();
  const uncategorized = locale === 'en' ? 'Uncategorized' : 'Sin categoría';

  for (const tx of list) {
    const amt = Number(tx.amount);
    if (INCOME_TYPES.has(tx.type)) {
      income += amt;
    } else if (EXPENSE_TYPES.has(tx.type)) {
      expenses += amt;
      const cat = (tx.category_id && categoryNames.get(tx.category_id))
        || tx.merchant
        || uncategorized;
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + amt);
    }
  }

  const balance = income - expenses;
  const totalAccounts = (accounts ?? []).reduce((s, a) => s + Number(a.balance), 0);

  const topCats = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amt]) => `• ${name}: ${formatMoney(amt, currency, locale)}`);

  const recent = list.slice(0, 5).map((tx) => {
    const sign = INCOME_TYPES.has(tx.type) ? '+' : '-';
    const title = tx.merchant || tx.description || tx.type;
    return `• ${sign}${formatMoney(Number(tx.amount), currency, locale)} ${title}`;
  });

  if (locale === 'en') {
    return [
      `📊 *Report · ${label}*`,
      ``,
      `Income: ${formatMoney(income, currency, locale)}`,
      `Expenses: ${formatMoney(expenses, currency, locale)}`,
      `Month balance: ${balance >= 0 ? '+' : ''}${formatMoney(balance, currency, locale)}`,
      `Accounts total: ${formatMoney(totalAccounts, currency, locale)}`,
      ``,
      topCats.length ? `*Top expenses by category*` : null,
      ...topCats,
      topCats.length ? `` : null,
      recent.length ? `*Recent activity*` : null,
      ...recent,
      ``,
      `_For the full PDF open MONI → Reports_`,
    ]
      .filter((line) => line != null)
      .join('\n');
  }

  return [
    `📊 *Reporte · ${label}*`,
    ``,
    `Ingresos: ${formatMoney(income, currency, locale)}`,
    `Gastos: ${formatMoney(expenses, currency, locale)}`,
    `Balance del mes: ${balance >= 0 ? '+' : ''}${formatMoney(balance, currency, locale)}`,
    `Saldo en cuentas: ${formatMoney(totalAccounts, currency, locale)}`,
    ``,
    topCats.length ? `*Top gastos por categoría*` : null,
    ...topCats,
    topCats.length ? `` : null,
    recent.length ? `*Últimos movimientos*` : null,
    ...recent,
    ``,
    `_Para el PDF completo abre MONI → Reportes_`,
  ]
    .filter((line) => line != null)
    .join('\n');
}

export function helpMessage(locale: BotLocale = 'es'): string {
  if (locale === 'en') {
    return [
      `👋 *Moni WhatsApp*`,
      ``,
      `*Log*`,
      `• I spent 80 at Starbucks`,
      `• I spent 150 on Uber with BBVA`,
      `• I received 5000 salary`,
      `• Voice note or receipt photo`,
      ``,
      `*Ask*`,
      `• *BALANCE* — account balances`,
      `• *REPORT* or *SUMMARY* — this month`,
      `• *HELP* — this message`,
      ``,
      `Savings goals: in the MONI app.`,
    ].join('\n');
  }
  return [
    `👋 *Moni WhatsApp*`,
    ``,
    `*Registrar*`,
    `• Gasté 80 en Starbucks`,
    `• Gasté 150 en Uber con BBVA`,
    `• Cobré 5000 de sueldo`,
    `• Nota de voz o foto de ticket`,
    ``,
    `*Consultar*`,
    `• *SALDO* — saldo de tus cuentas`,
    `• *RESUMEN* o *REPORTE* — mes actual`,
    `• *AYUDA* — este mensaje`,
    ``,
    `Also in English: *BALANCE*, *REPORT*, *HELP*.`,
    ``,
    `Metas de ahorro: en la app MONI.`,
  ].join('\n');
}
