import React from 'react';
import { View, ActivityIndicator, type PressableProps, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/hooks/useTheme';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';

interface BigButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export function BigButton({ title, loading, variant = 'primary', disabled, style, onPress, ...props }: BigButtonProps) {
  const { colors, radius } = useTheme();
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;

  return (
    <PressableScale
      disabled={inactive}
      onPress={onPress}
      scaleTo={0.97}
      style={[{ width: '100%', opacity: inactive ? 0.72 : 1 }, style as object]}
      {...props}
    >
      <View
        style={{
          borderRadius: radius,
          overflow: 'hidden',
          minHeight: 56,
          shadowColor: isPrimary ? colors.primary : '#000',
          shadowOpacity: isPrimary ? 0.35 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: isPrimary ? 6 : 2,
        }}
      >
        {isPrimary ? (
          <LinearGradient
            colors={[colors.primary, '#1FA34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
        )}
        <View
          style={{
            paddingVertical: 17,
            paddingHorizontal: 20,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 56,
            borderWidth: isPrimary ? 0 : StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: radius,
          }}
        >
          {loading ? (
            <ActivityIndicator color={isPrimary ? colors.primaryForeground : colors.foreground} />
          ) : (
            <AppText
              style={{
                color: isPrimary ? colors.primaryForeground : colors.foreground,
                fontSize: 17,
                fontFamily: Font.semibold,
                letterSpacing: -0.2,
              }}
            >
              {title}
            </AppText>
          )}
        </View>
      </View>
    </PressableScale>
  );
}
