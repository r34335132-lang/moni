import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { formatPercent } from '@/src/core/utils/format';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({ progress, color, height = 8, showLabel }: ProgressBarProps) {
  const { colors, radius } = useTheme();
  const clamped = Math.min(100, Math.max(0, progress));
  const barColor = color ?? (clamped >= 90 ? colors.destructive : colors.primary);

  return (
    <View>
      <View
        style={{
          height,
          backgroundColor: colors.secondary,
          borderRadius: radius,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${clamped}%`,
            backgroundColor: barColor,
            borderRadius: radius,
          }}
        />
      </View>
      {showLabel ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4, textAlign: 'right' }}>
          {formatPercent(clamped)}
        </Text>
      ) : null}
    </View>
  );
}
