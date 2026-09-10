import React from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[
          {
            backgroundColor: colors.input,
            borderRadius: radius,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: error ? colors.destructive : colors.border,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}
