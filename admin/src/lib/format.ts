const nf = new Intl.NumberFormat('es-MX');
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

export const fmt = (n: number) => nf.format(Math.round(n));
export const fmtMoney = (n: number) => money.format(n);

export function pct(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

/** Growth vs previous period; null when there's no baseline. */
export function growth(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}

export function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace(/\.0$/, '')}%`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function shortDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'Nunca';
  const diff = Date.now() - Date.parse(iso);
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `Hace ${d} d`;
  const m = Math.round(d / 30);
  return m < 12 ? `Hace ${m} mes${m > 1 ? 'es' : ''}` : `Hace ${Math.round(m / 12)} año(s)`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';
}

const PRICE_MONTHLY = Number(import.meta.env.VITE_PRICE_MONTHLY ?? 79);
const PRICE_YEARLY = Number(import.meta.env.VITE_PRICE_YEARLY ?? 699);

export function isYearly(productId: string): boolean {
  return /year|annual|anual/i.test(productId);
}

/** Estimated monthly recurring revenue from active products (store fees not deducted). */
export function estimateMrr(byProduct: { key: string; count: number }[]): number {
  return byProduct.reduce((sum, p) => sum + p.count * (isYearly(p.key) ? PRICE_YEARLY / 12 : PRICE_MONTHLY), 0);
}

export function productLabel(productId: string | null): string {
  if (!productId) return '—';
  return isYearly(productId) ? 'Anual' : 'Mensual';
}

export function platformLabel(p: string | null): string {
  if (p === 'ios') return 'iOS';
  if (p === 'android') return 'Android';
  return '—';
}
