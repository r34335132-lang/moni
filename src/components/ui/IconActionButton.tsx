import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';
import { useTheme } from '@/src/hooks/useTheme';

export type IconActionVariant = 'edit' | 'delete' | 'neutral';

const VARIANT = {
  edit: {
    lightBg: 'rgba(45,190,90,0.14)',
    darkBg: 'rgba(61,219,108,0.18)',
    lightFg: '#176B35',
    darkFg: '#3DDB6C',
    icon: 'pencil' as const,
  },
  delete: {
    lightBg: 'rgba(229,72,77,0.12)',
    darkBg: 'rgba(255,99,105,0.18)',
    lightFg: '#C4363A',
    darkFg: '#FF6369',
    icon: 'trash' as const,
  },
  neutral: {
    lightBg: 'rgba(17,17,19,0.06)',
    darkBg: 'rgba(255,255,255,0.10)',
    lightFg: '#3A3A42',
    darkFg: '#E5E5EA',
    icon: 'ellipsis-horizontal' as const,
  },
};

interface IconActionButtonProps {
  variant: IconActionVariant;
  onPress: () => void;
  /** Override default icon */
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Soft circular edit/delete control — MonAi style, MONI colors */
export function IconActionButton({
  variant,
  onPress,
  icon,
  size = 'md',
  label,
  accessibilityLabel,
  style,
}: IconActionButtonProps) {
  const { isDark } = useTheme();
  const v = VARIANT[variant];
  const dim = size === 'sm' ? 36 : size === 'lg' ? 52 : 42;
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
  const bg = isDark ? v.darkBg : v.lightBg;
  const fg = isDark ? v.darkFg : v.lightFg;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[{ alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <View
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon ?? v.icon} size={iconSize} color={fg} />
      </View>
      {label ? (
        <AppText
          style={{
            color: fg,
            fontSize: 11,
            fontFamily: Font.semibold,
            marginTop: 4,
          }}
          numberOfLines={1}
        >
          {label}
        </AppText>
      ) : null}
    </PressableScale>
  );
}

interface SwipeActionPillProps {
  variant: 'edit' | 'delete';
  label: string;
  onPress: () => void;
}

/** Tall soft pill used inside swipe-to-reveal actions */
export function SwipeActionPill({ variant, label, onPress }: SwipeActionPillProps) {
  const { isDark } = useTheme();
  const v = VARIANT[variant];
  const bg = isDark ? v.darkBg : v.lightBg;
  const fg = isDark ? v.darkFg : v.lightFg;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 76,
        marginVertical: 8,
        marginRight: 8,
        borderRadius: 22,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={v.icon} size={18} color={fg} />
      </View>
      <AppText style={{ color: fg, fontSize: 12, fontFamily: Font.semibold }}>{label}</AppText>
    </PressableScale>
  );
}
