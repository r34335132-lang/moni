import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { PressableScale } from '@/src/components/ui/Glass';

interface VoiceMicOrbProps {
  listening: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function VoiceMicOrb({ listening, onPress, disabled }: VoiceMicOrbProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (listening) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 780, easing: Easing.out(Easing.quad) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 120 });
    }
  }, [listening, pulse]);

  const ring1 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.22 }],
    opacity: 0.4 - pulse.value * 0.22,
  }));
  const ring2 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.38 }],
    opacity: 0.24 - pulse.value * 0.14,
  }));

  return (
    <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.55 : 1 }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 128,
            height: 128,
            borderRadius: 64,
            borderWidth: 1.5,
            borderColor: listening ? '#A855F7' : '#30D158',
          },
          ring1,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 128,
            height: 128,
            borderRadius: 64,
            borderWidth: 1.5,
            borderColor: listening ? '#C084FC' : '#4ADE80',
          },
          ring2,
        ]}
      />
      <PressableScale onPress={onPress} disabled={disabled} scaleTo={0.94}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            overflow: 'hidden',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(255,255,255,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LinearGradient
            colors={listening ? ['#C084FC', '#A855F7', '#7C3AED'] : ['#34D399', '#30D158', '#248A3D']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
          />
          <Ionicons name={listening ? 'stop' : 'mic'} size={38} color="#FFFFFF" />
        </View>
      </PressableScale>
    </View>
  );
}
