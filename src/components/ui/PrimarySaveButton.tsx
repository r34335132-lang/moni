import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, type TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Verde MONI — hardcoded para que NativeWind no borre el fondo */
const BTN_GREEN = '#22C55E';
const BTN_GREEN_DARK = '#16A34A';
const BTN_TEXT = '#FFFFFF';

interface PrimarySaveButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function PrimarySaveButton({
  title,
  loading,
  icon = 'checkmark-circle',
  disabled,
  onPress,
  style,
  ...rest
}: PrimarySaveButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[{ width: '100%' }, style as object]}
      {...rest}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          backgroundColor: BTN_GREEN,
          paddingVertical: 18,
          paddingHorizontal: 24,
          borderRadius: 16,
          minHeight: 58,
          borderWidth: 2,
          borderColor: BTN_GREEN_DARK,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 10,
          opacity: disabled || loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color={BTN_TEXT} size="small" />
        ) : (
          <>
            <Ionicons name={icon} size={26} color={BTN_TEXT} />
            <Text
              style={{
                color: BTN_TEXT,
                fontSize: 18,
                fontWeight: '800',
                letterSpacing: 0.2,
              }}
            >
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
