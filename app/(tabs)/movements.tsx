import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { MovementRow } from '@/components/MovementRow';
import type { Movement } from '@/context/MovementsContext';
import { useMovements } from '@/context/MovementsContext';
import { useColors } from '@/hooks/useColors';

type Filter = 'all' | 'income' | 'expense';

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'income', label: 'Ingresos' },
  { key: 'expense', label: 'Gastos' },
];

function groupByDate(movements: Movement[]): { date: string; items: Movement[] }[] {
  const map: Record<string, Movement[]> = {};
  movements.forEach((m) => {
    const key = new Date(m.date).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (!map[key]) map[key] = [];
    map[key].push(m);
  });
  return Object.entries(map).map(([date, items]) => ({ date, items }));
}

export default function MovementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { movements } = useMovements();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    let list = movements;
    if (filter !== 'all') list = list.filter((m) => m.type === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) =>
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          String(m.amount).includes(q),
      );
    }
    return list;
  }, [movements, filter, query]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const totalIncome = filtered.filter((m) => m.type === 'income').reduce((s, m) => s + m.amount, 0);
  const totalExpenses = filtered.filter((m) => m.type === 'expense').reduce((s, m) => s + m.amount, 0);

  type ListItem =
    | { kind: 'header'; date: string; id: string }
    | { kind: 'row'; movement: Movement; isLast: boolean; id: string };

  const flatData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    groups.forEach(({ date, items: groupItems }) => {
      items.push({ kind: 'header', date, id: `h-${date}` });
      groupItems.forEach((m, i) => {
        items.push({ kind: 'row', movement: m, isLast: i === groupItems.length - 1, id: m.id });
      });
    });
    return items;
  }, [groups]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Movimientos</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/add-movement');
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
          placeholder="Buscar..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {FILTER_LABELS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterTab, filter === f.key && [styles.filterTabActive, { borderBottomColor: colors.primary }]]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, { color: filter === f.key ? colors.primary : colors.mutedForeground }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
        {filtered.length > 0 && (
          <Text style={[styles.filterCount, { color: colors.mutedForeground }]}>{filtered.length}</Text>
        )}
      </View>

      {/* Summary */}
      {filter !== 'all' && filtered.length > 0 && (
        <View style={[styles.summary, { borderBottomColor: colors.border }]}>
          <Text style={[styles.summaryVal, { color: filter === 'income' ? '#22C55E' : colors.foreground }]}>
            {filter === 'income'
              ? `+${totalIncome.toLocaleString('es-MX')}`
              : `-${totalExpenses.toLocaleString('es-MX')}`}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>total</Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={flatData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 110, flexGrow: 1 }}
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <Text style={[styles.dateHeader, { color: colors.mutedForeground }]}>
                {item.date.charAt(0).toUpperCase() + item.date.slice(1)}
              </Text>
            );
          }
          return (
            <MovementRow
              movement={item.movement}
              showSeparator={!item.isLast}
              onPress={() => router.push(`/add-movement?id=${item.movement.id}` as any)}
            />
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Sin movimientos"
            subtitle="Agrega tu primer ingreso o gasto"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 24,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {},
  filterText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  filterCount: { marginLeft: 'auto', fontSize: 12, fontFamily: 'Inter_400Regular' },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  summaryVal: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  summaryLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  dateHeader: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 6,
    textTransform: 'capitalize',
  },
});
