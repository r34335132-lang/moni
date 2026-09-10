import type { Account, Category } from '@/src/core/types/entities';

export type PaymentMethod = 'cash' | 'card';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Comida: ['comida', 'restaurante', 'comí', 'almorcé', 'desayuné', 'cena', 'taqueria', 'tacos', 'pizza', 'hamburguesa', 'starbucks', 'cafeteria', 'café'],
  Supermercado: ['super', 'walmart', 'soriana', 'chedraui', 'oxxo', 'seven', '7-eleven', 'despensa', 'mercado', 'bodega', 'aurrera', 'heb', 'costco', 'sam\'s'],
  Gasolina: ['gasolina', 'gas', 'combustible', 'pemex', 'shell', 'bp', 'mobil'],
  Transporte: ['uber', 'taxi', 'metro', 'camión', 'camion', 'transporte', 'didi', 'cabify', 'autobus', 'estacionamiento', 'caseta'],
  Entretenimiento: ['cine', 'netflix', 'spotify', 'juego', 'entretenimiento', 'concierto', 'bar', 'antro'],
  Salud: ['farmacia', 'doctor', 'medicina', 'salud', 'hospital', 'simi', 'guadalajara', 'consulta'],
  Servicios: ['luz', 'agua', 'internet', 'teléfono', 'telefono', 'cfe', 'telmex', 'totalplay', 'izzi', 'servicio'],
  Hogar: ['renta', 'casa', 'hogar', 'muebles', 'home depot', 'coppel'],
  Suscripciones: ['suscripción', 'suscripcion', 'mensualidad', 'membresía', 'membresia'],
  Compras: ['compras', 'amazon', 'mercadolibre', 'shein', 'temu', 'liverpool', 'suburbia'],
  Educación: ['escuela', 'colegio', 'universidad', 'curso', 'libros'],
  Salario: ['salario', 'sueldo', 'nómina', 'nomina', 'quincena'],
  Freelance: ['freelance', 'honorarios', 'factura'],
};

const CASH_KEYWORDS = [
  'efectivo', 'cash', 'billete', 'monedas', 'en mano', 'pago en efectivo',
  'recibido', 'cambio $', 'cambio:',
];
const CARD_KEYWORDS = [
  'tarjeta', 'crédito', 'credito', 'débito', 'debito', 'tdc', 'visa', 'mastercard',
  'amex', 'american express', 'clip', 'terminal', 'banco', '****', 'xxxx',
  'pago con tarjeta', 'terminación', 'terminacion',
];

export function detectPaymentMethod(text: string): PaymentMethod | null {
  const lower = text.toLowerCase();
  if (CASH_KEYWORDS.some((kw) => lower.includes(kw))) return 'cash';
  if (CARD_KEYWORDS.some((kw) => lower.includes(kw))) return 'card';
  return null;
}

export function suggestCategoryName(text: string, categories: { name: string }[] = []): string | null {
  const lower = text.toLowerCase();
  let best: { name: string; len: number } | null = null;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw) && (!best || kw.length > best.len)) {
        best = { name: category, len: kw.length };
      }
    }
  }
  if (best) return best.name;
  const named = categories.find((c) => c.name.length > 2 && lower.includes(c.name.toLowerCase()));
  return named?.name ?? null;
}

export function matchCategoryId(name: string | null, categories: Category[]): string | null {
  if (!name || !categories.length) return null;
  const needle = name.toLowerCase();
  const exact = categories.find((c) => c.name.toLowerCase() === needle);
  if (exact) return exact.id;
  const partial = categories.find((c) => c.name.toLowerCase().includes(needle) || needle.includes(c.name.toLowerCase()));
  return partial?.id ?? null;
}

export function suggestAccountId(
  accounts: Account[],
  method: PaymentMethod | null,
  text = '',
): string | null {
  if (!accounts.length) return null;
  const lower = text.toLowerCase();

  const byName = accounts.find((a) => lower.includes(a.name.toLowerCase()) && a.name.length > 2);
  if (byName) return byName.id;

  if (method === 'cash') {
    return (
      accounts.find((a) => a.type === 'cash')?.id ??
      accounts.find((a) => a.name.toLowerCase().includes('efectivo'))?.id ??
      accounts[0].id
    );
  }

  if (method === 'card') {
    return (
      accounts.find((a) => a.type === 'credit')?.id ??
      accounts.find((a) => a.type === 'bank')?.id ??
      accounts.find((a) => /tarjeta|crédito|credito|débito|debito|banco/i.test(a.name))?.id ??
      accounts.find((a) => a.type !== 'cash')?.id ??
      accounts[0].id
    );
  }

  return accounts.find((a) => a.is_default)?.id ?? accounts[0].id;
}

export function accountMethod(account: Account): PaymentMethod {
  if (account.type === 'cash' || account.name.toLowerCase().includes('efectivo')) return 'cash';
  return 'card';
}
