import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCategoryById } from '@/constants/categories';
import type { Movement } from '@/context/MovementsContext';
import { useColors } from '@/hooks/useColors';

interface MovementRowProps {
  movement: Movement;
  showSeparator?: boolean;
  onPress?: () => void;
}

export function MovementRow({ movement, showSeparator = false, onPress }: MovementRowProps) {
  const colors = useColors();
  const category = getCategoryById(movement.category);
  const isIncome = movement.type === 'income';
  const date = new Date(movement.date);
  const dateStr = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.muted }]}
        onPress={onPress}
        android_ripple={{ color: colors.border }}
      >
        <View style={[styles.iconWrap, { backgroundColor: (category?.color ?? colors.primary) + '18' }]}>
          <Ionicons
            name={category?.icon ?? 'ellipsis-horizontal-circle-outline'}
            size={20}
            color={category?.color ?? colors.primary}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={1}>
            {movement.description || category?.name || 'Movimiento'}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {category?.name ?? movement.category} · {dateStr}
          </Text>
        </View>
        <Text style={[styles.amount, { color: isIncome ? '#22C55E' : colors.foreground }]}>
          {isIncome ? '+' : '-'}{movement.amount.toLocaleString('es-MX')}
        </Text>
      </Pressable>
      {showSeparator && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  description: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  amount: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 66 },
});
