import React from 'react';
import { Pressable, Text, ActivityIndicator, View, type PressableProps } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

/** Colores fijos — NativeWind puede borrar backgroundColor en Pressable */
const PRIMARY_BG = '#22C55E';
const PRIMARY_FG = '#FFFFFF';
const DESTRUCTIVE_BG = '#EF4444';
const DESTRUCTIVE_FG = '#FFFFFF';
const SECONDARY_BG = '#F1F5F9';
const SECONDARY_FG = '#0F172A';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ title, variant = 'primary', loading, size = 'md', disabled, style, ...props }: ButtonProps) {
  const { colors, radius } = useTheme();

  const styles = {
    primary: { bg: PRIMARY_BG, fg: PRIMARY_FG, border: PRIMARY_BG },
    secondary: { bg: SECONDARY_BG, fg: SECONDARY_FG, border: colors.border },
    destructive: { bg: DESTRUCTIVE_BG, fg: DESTRUCTIVE_FG, border: DESTRUCTIVE_BG },
    ghost: { bg: 'transparent', fg: colors.foreground, border: colors.border },
  }[variant];

  const pad = { sm: 10, md: 14, lg: 18 }[size];

  return (
    <Pressable disabled={disabled || loading} style={[{ width: '100%' }, style as object]} {...props}>
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: styles.bg,
            paddingVertical: pad,
            paddingHorizontal: 20,
            borderRadius: radius,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed || disabled ? 0.75 : 1,
            borderWidth: variant === 'ghost' ? 1 : 0,
            borderColor: styles.border,
            minHeight: size === 'sm' ? 40 : 48,
          }}
        >
          {loading ? (
            <ActivityIndicator color={styles.fg} />
          ) : (
            <Text style={{ color: styles.fg, fontSize: size === 'sm' ? 14 : 16, fontWeight: '700' }}>{title}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
