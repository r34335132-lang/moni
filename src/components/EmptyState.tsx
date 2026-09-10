import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Ionicons name={icon} size={48} color={colors.mutedForeground} />
      <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 20, width: '100%', maxWidth: 280 }}>
          <PrimarySaveButton title={actionLabel} onPress={onAction} icon="add-circle" />
        </View>
      ) : null}
    </View>
  );
}
