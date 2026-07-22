import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon} size={36} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});
