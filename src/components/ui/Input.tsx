import React from 'react';
import { View, type TextInputProps } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { AppText, AppTextInput } from '@/src/components/ui/AppText';
import { Font } from '@/constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors, radius, isDark } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <AppText
          style={{
            color: colors.mutedForeground,
            fontFamily: Font.semibold,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          {label}
        </AppText>
      ) : null}
      <AppTextInput
        placeholderTextColor={colors.mutedForeground}
        style={[
          {
            backgroundColor: colors.fill,
            borderRadius: radius,
            paddingHorizontal: 16,
            paddingVertical: 15,
            minHeight: 54,
            fontSize: 17,
            fontFamily: Font.regular,
            color: colors.foreground,
            borderWidth: error ? 1.5 : 0,
            borderColor: error ? colors.destructive : 'transparent',
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <AppText variant="caption" style={{ color: colors.destructive, marginTop: 6 }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
