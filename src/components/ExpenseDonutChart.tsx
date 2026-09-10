import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { getCategoryIcon } from '@/src/core/constants/categories';
import { formatCurrency, formatPercent } from '@/src/core/utils/format';

export interface ExpenseSlice {
  name: string;
  amount: number;
  color: string;
  icon?: string | null;
}

interface ExpenseDonutChartProps {
  data: ExpenseSlice[];
  total: number;
  currency?: string;
  title?: string;
  subtitle?: string;
  centerLabel?: string;
}

export function ExpenseDonutChart({
  data,
  total,
  currency = 'MXN',
  title = 'Reporte de gastos',
  subtitle,
  centerLabel,
}: ExpenseDonutChartProps) {
  const { colors, radius } = useTheme();

  if (!data.length || total <= 0) {
    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radius,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
          {title}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: 'center' }}>
          Registra gastos para ver tu reporte circular
        </Text>
      </View>
    );
  }

  const pieData = data.map((item) => ({
    value: item.amount,
    color: item.color,
    text: item.name,
  }));

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700', marginBottom: 2 }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 16 }}>{subtitle}</Text>
      ) : (
        <View style={{ marginBottom: 16 }} />
      )}

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <PieChart
          data={pieData}
          donut
          radius={100}
          innerRadius={68}
          innerCircleColor={colors.card}
          strokeColor={colors.card}
          strokeWidth={2}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Total</Text>
              <Text
                style={{ color: colors.foreground, fontSize: 15, fontWeight: '700' }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {centerLabel ?? formatCurrency(total, currency)}
              </Text>
            </View>
          )}
        />
      </View>

      <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
        {data.map((item) => {
          const pct = total > 0 ? (item.amount / total) * 100 : 0;
          return (
            <View key={item.name} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${item.color}22`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={getCategoryIcon(item.icon)} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {formatPercent(pct)} del total
                  </Text>
                </View>
                <Text
                  style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(item.amount, currency)}
                </Text>
              </View>
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.secondary,
                  marginLeft: 46,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: item.color,
                    borderRadius: 2,
                  }}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function buildExpenseSlices(
  transactions: Array<{
    amount: number;
    category?: { name?: string; color?: string; icon?: string | null } | null;
  }>,
): ExpenseSlice[] {
  const map: Record<string, { amount: number; color: string; icon: string | null }> = {};
  const palette = ['#F97316', '#3B82F6', '#8B5CF6', '#EF4444', '#22C55E', '#EC4899', '#EAB308', '#0EA5E9'];

  transactions.forEach((tx) => {
    const name = tx.category?.name ?? 'Otros';
    const color = tx.category?.color ?? palette[Object.keys(map).length % palette.length];
    const icon = tx.category?.icon ?? 'ellipsis-horizontal';
    if (!map[name]) map[name] = { amount: 0, color, icon };
    map[name].amount += Number(tx.amount);
  });

  return Object.entries(map)
    .map(([name, { amount, color, icon }]) => ({ name, amount, color, icon }))
    .sort((a, b) => b.amount - a.amount);
}
