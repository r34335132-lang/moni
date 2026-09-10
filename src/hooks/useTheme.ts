import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  return {
    isDark,
    colors: c,
    radius: colors.radius,
  };
}
