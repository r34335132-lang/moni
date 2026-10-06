import React, { useEffect, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { AppText, Font } from '@/src/components/ui/AppText';
import { formatCurrency } from '@/src/core/utils/format';

export type MoneyTone = 'neutral' | 'income' | 'expense' | 'primary';

interface MoneyDisplayProps {
  amount: number;
  currency?: string;
  tone?: MoneyTone;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  staged?: boolean;
  align?: 'center' | 'left' | 'right';
  style?: StyleProp<ViewStyle>;
}

const SIZE = {
  sm: { main: 20, padV: 10, padH: 12, radius: 16 },
  md: { main: 26, padV: 12, padH: 14, radius: 18 },
  lg: { main: 36, padV: 14, padH: 16, radius: 22 },
  xl: { main: 44, padV: 16, padH: 18, radius: 24 },
} as const;

/**
 * Simple hero money — one full formatted string, stable size (no nested Text shrink bugs).
 */
export function MoneyDisplay({
  amount,
  currency = 'MXN',
  tone = 'neutral',
  size = 'lg',
  label,
  staged = true,
  align = 'center',
  style,
}: MoneyDisplayProps) {
  const { colors, isDark } = useTheme();
  const s = SIZE[size];
  const safe = Number.isFinite(amount) ? amount : 0;
  const text = useMemo(() => formatCurrency(safe, currency), [safe, currency]);

  // Shrink only for very long amounts, never crush short ones like $0.00
  const digitLen = String(Math.floor(Math.abs(safe))).length;
  const fontSize = digitLen >= 9 ? s.main * 0.72 : digitLen >= 7 ? s.main * 0.85 : s.main;
  const lineHeight = Math.round(fontSize * 1.25);

  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = 0.97;
    scale.value = withSpring(1, { damping: 18, stiffness: 280, mass: 0.7 });
  }, [safe, scale]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const toneColor =
    tone === 'income'
      ? '#2DBE5A'
      : tone === 'expense'
        ? colors.destructive
        : tone === 'primary'
          ? colors.primary
          : colors.foreground;

  const stageBg =
    tone === 'income'
      ? isDark
        ? 'rgba(45,190,90,0.14)'
        : 'rgba(45,190,90,0.10)'
      : tone === 'expense'
        ? isDark
          ? 'rgba(229,72,77,0.14)'
          : 'rgba(229,72,77,0.10)'
        : tone === 'primary'
          ? colors.accent
          : colors.fill;

  const digits = (
    <Animated.View style={[{ width: '100%' }, anim]}>
      <AppText
        style={{
          color: toneColor,
          fontFamily: Font.bold,
          fontSize,
          lineHeight,
          letterSpacing: -0.8,
          textAlign: align,
          width: '100%',
        }}
        maxFontSizeMultiplier={1.2}
      >
        {text}
      </AppText>
    </Animated.View>
  );

  if (!staged) {
    return (
      <View
        style={[
          {
            width: '100%',
            alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          },
          style,
        ]}
      >
        {label ? (
          <AppText style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: Font.medium, marginBottom: 6 }}>
            {label}
          </AppText>
        ) : null}
        {digits}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: stageBg,
          borderRadius: s.radius,
          paddingVertical: s.padV,
          paddingHorizontal: s.padH,
        },
        style,
      ]}
    >
      {label ? (
        <AppText
          style={{
            color: colors.mutedForeground,
            fontSize: 13,
            fontFamily: Font.semibold,
            marginBottom: 8,
            textAlign: align,
          }}
        >
          {label}
        </AppText>
      ) : null}
      {digits}
    </View>
  );
}
