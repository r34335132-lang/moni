import React from 'react';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

interface AnimatedInProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  mode?: 'down' | 'fade';
}

/** Short iOS-like enter — use on lists and dashboard blocks */
export function AnimatedIn({ children, index = 0, delay = 0, style, mode = 'down' }: AnimatedInProps) {
  const entering =
    mode === 'fade'
      ? FadeIn.delay(delay + index * 35).duration(200)
      : FadeInDown.delay(delay + index * 40)
          .duration(260)
          .springify()
          .damping(28)
          .stiffness(320)
          .mass(0.7);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
