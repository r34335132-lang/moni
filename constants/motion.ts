import { Easing } from 'react-native-reanimated';

/** Snappy iOS-like motion — short, decisive, never floaty */
export const Motion = {
  pressIn: { duration: 70, easing: Easing.out(Easing.cubic) },
  pressOut: { duration: 140, easing: Easing.out(Easing.cubic) },
  fade: { duration: 160, easing: Easing.out(Easing.cubic) },
  sheet: { duration: 280, easing: Easing.out(Easing.cubic) },
  chart: 280,
} as const;
