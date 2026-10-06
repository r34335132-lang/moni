import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type PressableProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { Motion } from '@/constants/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassSurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  padding?: number;
}

/** Apple-like frosted glass panel */
export function GlassSurface({
  children,
  style,
  intensity = 28,
  tint,
  borderRadius = 22,
  padding = 16,
}: GlassSurfaceProps) {
  const { isDark } = useTheme();
  const blurTint = tint ?? (isDark ? 'dark' : 'light');

  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)',
          backgroundColor: isDark ? 'rgba(28,28,30,0.72)' : 'rgba(255,255,255,0.72)',
        },
        style,
      ]}
    >
      <BlurView intensity={intensity} tint={blurTint} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']
            : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.18)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  scaleTo?: number;
}

export function PressableScale({
  children,
  style,
  haptic = true,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPress={(e) => {
        if (haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }
        onPress?.(e);
      }}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, Motion.pressIn);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, Motion.pressOut);
        onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

interface GlassIconBadgeProps {
  color: string;
  size?: number;
  children: React.ReactNode;
}

export function GlassIconBadge({ color, size = 44, children }: GlassIconBadgeProps) {
  const { isDark } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${color}${isDark ? '33' : '22'}`,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${color}55`,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={[`${color}44`, `${color}12`]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      {children}
    </View>
  );
}
