import React from 'react';
import {
  View,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';
import { useTheme } from '@/src/hooks/useTheme';

interface PrimarySaveButtonProps {
  title: string;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}

export function PrimarySaveButton({
  title,
  loading,
  icon = 'checkmark-circle',
  disabled,
  onPress,
  style,
}: PrimarySaveButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      scaleTo={0.97}
      style={[{ width: '100%', opacity: inactive ? 0.72 : 1 }, style]}
    >
      <View
        style={{
          borderRadius: 980,
          backgroundColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 16,
          paddingHorizontal: 22,
          minHeight: 56,
          shadowColor: colors.primary,
          shadowOpacity: 0.35,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryForeground} size="small" />
        ) : (
          <>
            <Ionicons name={icon} size={22} color={colors.primaryForeground} />
            <AppText
              style={{
                color: colors.primaryForeground,
                fontSize: 17,
                fontFamily: Font.semibold,
                letterSpacing: -0.2,
              }}
            >
              {title}
            </AppText>
          </>
        )}
      </View>
    </PressableScale>
  );
}
