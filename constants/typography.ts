import type { TextStyle } from 'react-native';

/** Plus Jakarta Sans — legible for seniors, clean for younger users */
export const Font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export const Type = {
  hero: {
    fontFamily: Font.bold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  headline: {
    fontFamily: Font.semibold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.25,
  },
  body: {
    fontFamily: Font.regular,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.15,
  },
  callout: {
    fontFamily: Font.medium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  caption: {
    fontFamily: Font.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.05,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  tab: {
    fontFamily: Font.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: -0.05,
  },
} as const;

export function familyForWeight(weight?: TextStyle['fontWeight']): string {
  const w = String(weight ?? '400');
  if (w === '700' || w === '800' || w === '900' || w === 'bold') return Font.bold;
  if (w === '600' || w === 'semibold') return Font.semibold;
  if (w === '500' || w === 'medium') return Font.medium;
  return Font.regular;
}
