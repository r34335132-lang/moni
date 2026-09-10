const IVA_RATE = 0.16;

export function applyIva(subtotal: number, includeIva: boolean): { subtotal: number; iva: number; total: number } {
  if (!includeIva || subtotal <= 0) {
    return { subtotal, iva: 0, total: subtotal };
  }
  const iva = Math.round(subtotal * IVA_RATE * 100) / 100;
  const total = Math.round((subtotal + iva) * 100) / 100;
  return { subtotal, iva, total };
}

export function parseDecimalInput(text: string): string {
  let cleaned = text.replace(/[^0-9.,+\-*/()%]/g, '').replace(/,/g, '.');
  if (!cleaned) return '';

  const isExpr = /[+\-*/()]/.test(cleaned);
  if (isExpr) return cleaned;

  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  const finalParts = cleaned.split('.');
  if (finalParts[1]?.length > 2) {
    cleaned = `${finalParts[0]}.${finalParts[1].slice(0, 2)}`;
  }
  return cleaned;
}

export function toNumber(value: string): number {
  const n = parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Convierte % final: "200+10%" → "200+(200*10/100)" */
function expandPercentages(expr: string): string {
  return expr.replace(/(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)\s*%/g, (_, left, op, pct) => {
    if (op === '+') return `${left}+(${left}*${pct}/100)`;
    if (op === '-') return `${left}-(${left}*${pct}/100)`;
    if (op === '*') return `${left}*(${pct}/100)`;
    return `${left}/(${pct}/100)`;
  }).replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');
}

/** Evalúa expresión: números, + - * / % */
export function evaluateExpression(expr: string): number | null {
  const trimmed = expr.trim();
  if (!trimmed) return null;

  let sanitized = trimmed.replace(/[^0-9+\-*/().%\s]/g, '').trim();
  if (!sanitized) return null;

  sanitized = expandPercentages(sanitized);

  if (/^[0-9.]+$/.test(sanitized)) {
    const n = parseFloat(sanitized);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  }

  if (/[+\-*/]$/.test(sanitized)) {
    sanitized = sanitized.slice(0, -1);
  }
  if (!sanitized) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== 'number' || !Number.isFinite(result)) return null;
    return Math.round(result * 100) / 100;
  } catch {
    const fallback = parseFloat(sanitized.replace(/[^0-9.]/g, ''));
    return Number.isFinite(fallback) ? Math.round(fallback * 100) / 100 : null;
  }
}

export { IVA_RATE };
