import React from 'react';
import { View, Text, type ViewProps } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
}

export function Card({ children, padding = 16, style, ...props }: CardProps) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius,
          padding,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export function StatCard({ label, value, subtitle, color }: StatCardProps) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 140,
        flex: 1,
      }}
    >
      <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 4 }} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={{ color: color ?? colors.foreground, fontSize: 20, fontWeight: '700' }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
