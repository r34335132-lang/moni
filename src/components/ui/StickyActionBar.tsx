import React from 'react';
import { View, Text, type TouchableOpacityProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';

interface StickyActionBarProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  subtitle?: string;
}

/** Barra fija inferior — siempre visible encima del contenido */
export function StickyActionBar({ title, loading, subtitle, disabled, onPress }: StickyActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 16),
        backgroundColor: '#FFFFFF',
        borderTopWidth: 2,
        borderTopColor: '#D1D5DB',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 20,
        zIndex: 999,
      }}
    >
      {subtitle ? (
        <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>{subtitle}</Text>
      ) : null}
      <PrimarySaveButton title={title} loading={loading} disabled={disabled} onPress={onPress} />
    </View>
  );
}
