import React from 'react';
import { View, Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

const BTN_GREEN = '#22C55E';
const BTN_TEXT = '#FFFFFF';

interface BigButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export function BigButton({ title, loading, variant = 'primary', disabled, style, ...props }: BigButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  if (isPrimary) {
    return (
      <Pressable disabled={disabled || loading} style={[{ width: '100%' }, style as object]} {...props}>
        <View
          style={{
            backgroundColor: BTN_GREEN,
            paddingVertical: 18,
            paddingHorizontal: 24,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 58,
            borderWidth: 2,
            borderColor: '#16A34A',
            opacity: disabled || loading ? 0.7 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color={BTN_TEXT} />
          ) : (
            <Text style={{ color: BTN_TEXT, fontSize: 18, fontWeight: '800' }}>{title}</Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: colors.secondary,
          paddingVertical: 18,
          paddingHorizontal: 24,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed || disabled ? 0.85 : 1,
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: 58,
          width: '100%',
        },
        style as object,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.foreground} />
      ) : (
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>{title}</Text>
      )}
    </Pressable>
  );
}
