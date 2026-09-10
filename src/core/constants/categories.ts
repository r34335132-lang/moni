import type { Ionicons } from '@expo/vector-icons';

export const DEFAULT_CATEGORY_COLORS = [
  '#F97316', '#3B82F6', '#8B5CF6', '#0EA5E9', '#EAB308',
  '#F59E0B', '#EF4444', '#A855F7', '#6366F1', '#78716C',
  '#14B8A6', '#EC4899', '#6B7280', '#DC2626', '#94A3B8',
  '#22C55E', '#3B82F6', '#16A34A', '#EC4899',
];

export const CATEGORY_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  restaurant: 'restaurant-outline',
  car: 'car-outline',
  cart: 'cart-outline',
  bus: 'bus-outline',
  flash: 'flash-outline',
  school: 'school-outline',
  medical: 'medical-outline',
  'game-controller': 'game-controller-outline',
  home: 'home-outline',
  paw: 'paw-outline',
  airplane: 'airplane-outline',
  bag: 'bag-outline',
  repeat: 'repeat-outline',
  cash: 'cash-outline',
  'ellipsis-horizontal': 'ellipsis-horizontal-outline',
  briefcase: 'briefcase-outline',
  laptop: 'laptop-outline',
  'trending-up': 'trending-up-outline',
  gift: 'gift-outline',
  wallet: 'wallet-outline',
  business: 'business-outline',
};

export function getCategoryIcon(icon?: string | null): keyof typeof Ionicons.glyphMap {
  if (!icon) return 'ellipsis-horizontal-outline';
  const mapped = CATEGORY_ICON_MAP[icon];
  if (mapped) return mapped;
  if (icon.endsWith('-outline') || icon.endsWith('-sharp')) {
    return icon as keyof typeof Ionicons.glyphMap;
  }
  return `${icon}-outline` as keyof typeof Ionicons.glyphMap;
}

/** Iconos seleccionables al crear categoría */
export const PICKABLE_CATEGORY_ICONS = [
  'restaurant', 'car', 'cart', 'bus', 'flash', 'school', 'medical', 'game-controller',
  'home', 'paw', 'airplane', 'bag', 'repeat', 'cash', 'briefcase', 'laptop',
  'trending-up', 'gift', 'wallet', 'business', 'ellipsis-horizontal',
] as const;

/** Nombres de categorías del sistema (seed en Supabase) */
export const SYSTEM_CATEGORY_NAMES = [
  'Comida', 'Gasolina', 'Supermercado', 'Transporte', 'Servicios',
  'Educación', 'Salud', 'Entretenimiento', 'Hogar', 'Mascotas',
  'Viajes', 'Compras', 'Suscripciones', 'Préstamos', 'Otros',
  'Salario', 'Freelance', 'Inversiones', 'Regalo',
];
