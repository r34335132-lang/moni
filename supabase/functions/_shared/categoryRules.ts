// Shared by the WhatsApp bot (Deno) and the app (React Native): keep this file free of imports and runtime APIs.

export type CategoryKind = 'expense' | 'income';

export interface CategoryLike {
  name: string;
  type?: string | null;
  user_id?: string | null;
}

interface Rule {
  kind: CategoryKind;
  /** Category names to look for in the user's list, in order of preference. */
  names: string[];
  /** Whole words, accent-insensitive; plural "s/es" is implied. A trailing "*" matches any ending. */
  keywords: string[];
}

const RULES: Rule[] = [
  {
    kind: 'expense',
    names: ['Comida', 'Restaurantes', 'Food'],
    keywords: [
      'comida', 'restaurante*', 'comi', 'almorce', 'almuerzo', 'desayune', 'desayuno', 'cena', 'cene',
      'taqueria', 'taco', 'pizza*', 'hamburguesa*', 'torta', 'sushi', 'antojito*', 'cafe', 'cafeteria',
      'starbucks', 'mcdonalds', 'kfc', 'burger king', 'dominos', 'little caesars', 'rappi', 'uber eats',
      'didi food', 'food', 'restaurant', 'lunch', 'dinner', 'breakfast',
    ],
  },
  {
    kind: 'expense',
    names: ['Supermercado', 'Despensa', 'Groceries'],
    keywords: [
      'super', 'supermercado', 'despensa', 'mandado', 'walmart', 'soriana', 'chedraui', 'oxxo', 'seven eleven',
      '7-eleven', 'bodega aurrera', 'aurrera', 'heb', 'costco', 'sams', 'la comer', 'city market', 'mercado',
      'grocery', 'groceries', 'supermarket',
    ],
  },
  {
    kind: 'expense',
    names: ['Gasolina', 'Combustible', 'Gas'],
    keywords: ['gasolina', 'gasolinera', 'combustible', 'diesel', 'magna', 'pemex', 'shell', 'bp', 'mobil', 'g500', 'gas', 'fuel', 'petrol'],
  },
  {
    kind: 'expense',
    names: ['Transporte', 'Transport'],
    keywords: [
      'uber', 'didi', 'cabify', 'taxi', 'metro', 'metrobus', 'camion', 'autobus', 'bus', 'transporte',
      'pasaje', 'estacionamiento', 'parking', 'caseta', 'peaje', 'tag', 'transport',
    ],
  },
  {
    kind: 'expense',
    names: ['Servicios', 'Utilities'],
    keywords: [
      'luz', 'cfe', 'agua', 'internet', 'telefono', 'celular', 'recarga', 'telmex', 'totalplay', 'izzi',
      'megacable', 'telcel', 'movistar', 'at&t', 'gas lp', 'gas natural', 'tanque de gas', 'pipa de gas',
      'predial', 'utilities', 'electricity', 'water bill',
    ],
  },
  {
    kind: 'expense',
    names: ['Educación', 'Escuela', 'Education'],
    keywords: [
      'escuela', 'colegiatura', 'colegio', 'universidad', 'curso', 'clase', 'libro', 'utiles', 'inscripcion',
      'maestro', 'tutor*', 'school', 'tuition', 'course', 'books',
    ],
  },
  {
    kind: 'expense',
    names: ['Deportes', 'Deporte', 'Gimnasio', 'Gym', 'Salud', 'Sports'],
    keywords: [
      'gimnasio', 'gym', 'natacion', 'alberca', 'yoga', 'crossfit', 'pilates', 'zumba', 'spinning', 'box',
      'futbol', 'basquet*', 'tenis de mesa', 'padel', 'entrenador', 'deporte*', 'sports', 'swimming',
    ],
  },
  {
    kind: 'expense',
    names: ['Salud', 'Health'],
    keywords: [
      'farmacia', 'doctor', 'medico', 'medicina*', 'medicamento*', 'hospital', 'consulta', 'dentista',
      'simi', 'benavides', 'farmacias guadalajara', 'laboratorio', 'analisis', 'optica', 'lentes',
      'psicologo', 'terapia', 'pharmacy', 'health',
    ],
  },
  {
    kind: 'expense',
    names: ['Entretenimiento', 'Entertainment'],
    keywords: [
      'cine', 'cinepolis', 'cinemex', 'concierto', 'boleto*', 'bar', 'antro', 'fiesta', 'teatro', 'museo',
      'boliche', 'videojuego*', 'juego*', 'movie', 'games',
    ],
  },
  {
    kind: 'expense',
    names: ['Suscripciones', 'Subscriptions'],
    keywords: [
      'netflix', 'spotify', 'disney', 'hbo', 'prime video', 'amazon prime', 'youtube premium', 'apple music',
      'icloud', 'chatgpt', 'suscripcion', 'membresia', 'mensualidad', 'subscription',
    ],
  },
  {
    kind: 'expense',
    names: ['Hogar', 'Casa', 'Home'],
    keywords: [
      'renta', 'hogar', 'casa', 'mueble*', 'home depot', 'ferreteria', 'limpieza', 'lavanderia', 'plomero',
      'electricista', 'rent', 'home',
    ],
  },
  {
    kind: 'expense',
    names: ['Mascotas', 'Pets'],
    keywords: ['veterinari*', 'mascota', 'perro', 'perrito', 'gato', 'croqueta', 'petco', 'pet', 'vet'],
  },
  {
    kind: 'expense',
    names: ['Viajes', 'Travel'],
    keywords: [
      'vuelo', 'avion', 'hotel', 'airbnb', 'hospedaje', 'viaje*', 'aeromexico', 'volaris', 'vivaaerobus',
      'flight', 'trip', 'travel',
    ],
  },
  {
    kind: 'expense',
    names: ['Compras', 'Shopping'],
    keywords: [
      'ropa', 'zapato', 'tenis', 'amazon', 'mercado libre', 'mercadolibre', 'shein', 'temu', 'liverpool',
      'suburbia', 'palacio de hierro', 'coppel', 'zara', 'regalo', 'compras', 'shopping', 'clothes',
    ],
  },
  {
    kind: 'income',
    names: ['Salario', 'Sueldo', 'Salary'],
    keywords: ['salario', 'sueldo', 'nomina', 'quincena', 'aguinaldo', 'salary', 'paycheck', 'payroll'],
  },
  {
    kind: 'income',
    names: ['Freelance', 'Honorarios'],
    keywords: ['freelance', 'honorarios', 'factura', 'proyecto', 'cliente', 'invoice'],
  },
  {
    kind: 'income',
    names: ['Inversiones', 'Investments'],
    keywords: ['inversion*', 'rendimiento*', 'interes', 'dividendo*', 'cetes', 'gbm', 'investment', 'dividends'],
  },
  {
    kind: 'income',
    names: ['Regalo', 'Regalos', 'Gift'],
    keywords: ['regalo', 'regalaron', 'gift'],
  },
];

const FALLBACK_NAMES = ['otros', 'otro', 'other', 'others', 'sin categoria'];

export function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordRegex(word: string): RegExp {
  const w = normalizeText(word);
  const body = w.endsWith('*')
    ? `${escapeRegex(w.slice(0, -1))}[a-z]*`
    : `${escapeRegex(w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w)}(?:s|es)?`;
  return new RegExp(`(^|[^a-z0-9])${body}($|[^a-z0-9])`);
}

function kindMatches(category: CategoryLike, kind?: CategoryKind): boolean {
  if (!kind || !category.type) return true;
  return category.type === kind || category.type === 'both';
}

/** Longest keyword hit per rule, best rules first. */
function matchingRules(text: string, kind?: CategoryKind): Rule[] {
  const hay = normalizeText(text);
  return RULES
    .filter((r) => !kind || r.kind === kind)
    .map((rule) => ({
      rule,
      len: Math.max(0, ...rule.keywords.filter((kw) => wordRegex(kw).test(hay)).map((kw) => kw.length)),
    }))
    .filter((m) => m.len > 0)
    .sort((a, b) => b.len - a.len)
    .map((m) => m.rule);
}

/**
 * Picks one of the user's categories for a movement text:
 * 1) a category name written in the text (custom categories win ties), 2) keyword rules, else null.
 */
export function pickCategory<T extends CategoryLike>(text: string, categories: T[], kind?: CategoryKind): T | null {
  const eligible = categories.filter((c) => kindMatches(c, kind));
  const hay = normalizeText(text);

  const named = eligible
    .filter((c) => !FALLBACK_NAMES.includes(normalizeText(c.name)) && normalizeText(c.name).length > 2)
    .filter((c) => wordRegex(c.name).test(hay))
    .sort((a, b) => b.name.length - a.name.length || Number(!!b.user_id) - Number(!!a.user_id));
  if (named[0]) return named[0];

  for (const rule of matchingRules(text, kind)) {
    for (const name of rule.names) {
      const found = eligible.find((c) => normalizeText(c.name) === normalizeText(name));
      if (found) return found;
    }
  }
  return null;
}

/** "Otros" (or equivalent) so unknown movements never land in an arbitrary category. */
export function fallbackCategory<T extends CategoryLike>(categories: T[], kind?: CategoryKind): T | null {
  return categories.find((c) => kindMatches(c, kind) && FALLBACK_NAMES.includes(normalizeText(c.name))) ?? null;
}

/** Name-only suggestion when the user's categories aren't loaded yet. */
export function suggestCategoryName(text: string, categories: CategoryLike[] = [], kind?: CategoryKind): string | null {
  if (categories.length) return pickCategory(text, categories, kind)?.name ?? null;
  return matchingRules(text, kind)[0]?.names[0] ?? null;
}

/** Reply like "Salud" or "categoría Salud" while confirming: exact category name only. */
export function parseCategoryReply<T extends CategoryLike>(text: string, categories: T[], kind?: CategoryKind): T | null {
  const t = normalizeText(text).replace(/[.!?]+$/, '').replace(/^(la\s+)?(categoria|category|en)\s+/, '').trim();
  if (!t) return null;
  return categories.find((c) => kindMatches(c, kind) && normalizeText(c.name) === t) ?? null;
}
