import React, { useEffect, useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { formatPercent } from '@/src/core/utils/format';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({ progress, color, height = 8, showLabel }: ProgressBarProps) {
  const { colors, radiusPill } = useTheme();
  const clamped = Math.min(100, Math.max(0, progress));
  const barColor = color ?? (clamped >= 90 ? colors.destructive : colors.primary);
  const [trackW, setTrackW] = useState(0);
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming((clamped / 100) * trackW, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, trackW, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    width: fill.value,
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackW(e.nativeEvent.layout.width);
  };

  return (
    <View>
      <View
        onLayout={onLayout}
        style={{
          height,
          backgroundColor: colors.fill,
          borderRadius: radiusPill,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              backgroundColor: barColor,
              borderRadius: radiusPill,
            },
            fillStyle,
          ]}
        />
      </View>
      {showLabel ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6, textAlign: 'right', fontWeight: '500' }}>
          {formatPercent(clamped)}
        </Text>
      ) : null}
    </View>
  );
}
