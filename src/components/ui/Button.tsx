import React from 'react';
import { View, ActivityIndicator, type PressableProps } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ title, variant = 'primary', loading, size = 'md', disabled, style, onPress, ...props }: ButtonProps) {
  const { colors } = useTheme();

  const styles = {
    primary: { bg: colors.primary, fg: colors.primaryForeground, border: 'transparent' },
    secondary: { bg: colors.fill, fg: colors.foreground, border: 'transparent' },
    // Soft coral pill (MonAi) instead of flat harsh red
    destructive: {
      bg: 'rgba(229,72,77,0.12)',
      fg: colors.destructive,
      border: 'transparent',
    },
    ghost: { bg: 'transparent', fg: colors.foreground, border: colors.border },
  }[variant];

  const pad = { sm: 12, md: 15, lg: 17 }[size];
  const fontSize = { sm: 15, md: 17, lg: 18 }[size];
  const inactive = disabled || loading;

  return (
    <PressableScale
      disabled={inactive}
      onPress={onPress}
      scaleTo={0.98}
      style={[{ width: '100%', opacity: inactive ? 0.65 : 1 }, style as object]}
      {...props}
    >
      <View
        style={{
          backgroundColor: styles.bg,
          paddingVertical: pad,
          paddingHorizontal: 20,
          borderRadius: 980,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: size === 'sm' ? 44 : 52,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: styles.border,
        }}
      >
        {loading ? (
          <ActivityIndicator color={styles.fg} />
        ) : (
          <AppText style={{ color: styles.fg, fontSize, fontFamily: Font.semibold }}>
            {title}
          </AppText>
        )}
      </View>
    </PressableScale>
  );
}
