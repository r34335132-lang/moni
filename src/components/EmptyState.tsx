import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { AppText, Font } from '@/src/components/ui/AppText';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 }}>
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.3 : 0.07,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}
      >
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <AppText
        style={{
          color: colors.foreground,
          fontFamily: Font.bold,
          fontSize: 20,
          textAlign: 'center',
          letterSpacing: -0.3,
        }}
      >
        {title}
      </AppText>
      {subtitle ? (
        <AppText
          style={{
            color: colors.mutedForeground,
            marginTop: 8,
            textAlign: 'center',
            fontSize: 15,
            lineHeight: 22,
            paddingHorizontal: 8,
          }}
        >
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 22, width: '100%', maxWidth: 280 }}>
          <PrimarySaveButton title={actionLabel} onPress={onAction} icon="add" />
        </View>
      ) : null}
    </View>
  );
}
