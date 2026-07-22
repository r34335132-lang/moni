import type { Ionicons } from '@expo/vector-icons';

export interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'comida', name: 'Comida', icon: 'fast-food-outline', color: '#F97316' },
  { id: 'restaurantes', name: 'Restaurantes', icon: 'restaurant-outline', color: '#EF4444' },
  { id: 'gasolina', name: 'Gasolina', icon: 'car-outline', color: '#3B82F6' },
  { id: 'supermercado', name: 'Supermercado', icon: 'cart-outline', color: '#8B5CF6' },
  { id: 'ropa', name: 'Ropa', icon: 'shirt-outline', color: '#EC4899' },
  { id: 'farmacia', name: 'Farmacia', icon: 'medical-outline', color: '#14B8A6' },
  { id: 'salud', name: 'Salud', icon: 'heart-outline', color: '#EF4444' },
  { id: 'escuela', name: 'Escuela', icon: 'school-outline', color: '#F59E0B' },
  { id: 'mascotas', name: 'Mascotas', icon: 'paw-outline', color: '#78716C' },
  { id: 'servicios', name: 'Servicios', icon: 'flash-outline', color: '#EAB308' },
  { id: 'casa', name: 'Casa', icon: 'home-outline', color: '#6366F1' },
  { id: 'viajes', name: 'Viajes', icon: 'airplane-outline', color: '#0EA5E9' },
  { id: 'entretenimiento', name: 'Entretenimiento', icon: 'game-controller-outline', color: '#A855F7' },
  { id: 'impuestos', name: 'Impuestos', icon: 'receipt-outline', color: '#6B7280' },
  { id: 'inversiones', name: 'Inversiones', icon: 'trending-up-outline', color: '#22C55E' },
  { id: 'otros', name: 'Otros', icon: 'ellipsis-horizontal-circle-outline', color: '#94A3B8' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'sueldo', name: 'Sueldo', icon: 'briefcase-outline', color: '#22C55E' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop-outline', color: '#3B82F6' },
  { id: 'negocio', name: 'Negocio', icon: 'storefront-outline', color: '#F59E0B' },
  { id: 'inversiones-ing', name: 'Inversiones', icon: 'trending-up-outline', color: '#22C55E' },
  { id: 'regalo', name: 'Regalo', icon: 'gift-outline', color: '#EC4899' },
  { id: 'otros-ing', name: 'Otros', icon: 'ellipsis-horizontal-circle-outline', color: '#94A3B8' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryById(id: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id);
}
