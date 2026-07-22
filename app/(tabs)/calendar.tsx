import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MovementRow } from '@/components/MovementRow';
import { useMovements } from '@/context/MovementsContext';
import { useReminders } from '@/context/RemindersContext';
import { useColors } from '@/hooks/useColors';

const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { movements } = useMovements();
  const { reminders } = useReminders();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const dayData = useMemo(() => {
    const map: Record<number, { inc: boolean; exp: boolean }> = {};
    movements.forEach((m) => {
      const d = new Date(m.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = { inc: false, exp: false };
        if (m.type === 'income') map[day].inc = true;
        else map[day].exp = true;
      }
    });
    return map;
  }, [movements, month, year]);

  const activeReminders = reminders.filter((r) => r.active);

  const selectedMovements = useMemo(() =>
    movements.filter((m) => {
      const d = new Date(m.date);
      return d.getDate() === selectedDay && d.getMonth() === month && d.getFullYear() === year;
    }),
    [movements, selectedDay, month, year],
  );

  const selectedReminders = activeReminders.filter((r) => r.dueDay === selectedDay);

  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad + 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 20 }]}>
        <Pressable onPress={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(1); }} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: colors.foreground }]}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable onPress={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(1); }} hitSlop={12}>
          <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Day labels */}
      <View style={styles.dayLabels}>
        {DAYS.map((d, i) => (
          <Text key={i} style={[styles.dayLabel, { color: colors.mutedForeground }]}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={styles.cell} />;
          const isToday = isCurrentMonth && day === today.getDate();
          const isSel = day === selectedDay;
          const data = dayData[day];
          const hasReminder = activeReminders.some((r) => r.dueDay === day);

          return (
            <Pressable
              key={day}
              style={[
                styles.cell,
                styles.dayCell,
                isSel && [styles.selectedCell, { backgroundColor: colors.foreground }],
                !isSel && isToday && [styles.todayCell, { borderColor: colors.primary }],
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[
                styles.dayNum,
                { color: isSel ? colors.background : isToday ? colors.primary : colors.foreground },
              ]}>
                {day}
              </Text>
              <View style={styles.dots}>
                {data?.inc && <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />}
                {data?.exp && <View style={[styles.dot, { backgroundColor: colors.destructive }]} />}
                {hasReminder && <View style={[styles.dot, { backgroundColor: '#A855F7' }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Day detail */}
      <View style={styles.detail}>
        <Text style={[styles.detailTitle, { color: colors.foreground }]}>
          {selectedDay} de {MONTHS[month]}
        </Text>

        {selectedReminders.map((r) => (
          <View key={r.id} style={[styles.reminderRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.reminderDot, { backgroundColor: '#A855F7' }]} />
            <Text style={[styles.reminderText, { color: colors.foreground }]}>{r.title}</Text>
            {r.amount > 0 && (
              <Text style={[styles.reminderAmt, { color: colors.mutedForeground }]}>
                ${r.amount.toLocaleString('es-MX')}
              </Text>
            )}
          </View>
        ))}

        {selectedMovements.length > 0 ? (
          <View style={[styles.movList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {selectedMovements.map((m, i) => (
              <MovementRow
                key={m.id}
                movement={m}
                showSeparator={i < selectedMovements.length - 1}
                onPress={() => router.push(`/add-movement?id=${m.id}` as any)}
              />
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyDay, { color: colors.mutedForeground }]}>Sin movimientos</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  monthTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  dayLabels: { flexDirection: 'row', paddingHorizontal: 12 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_600SemiBold', paddingVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 8 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCell: { borderRadius: 10 },
  selectedCell: {},
  todayCell: { borderWidth: 1.5 },
  dayNum: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  dots: { flexDirection: 'row', gap: 2, height: 5, alignItems: 'center', marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  divider: { height: 1, marginVertical: 12 },
  detail: { paddingHorizontal: 24 },
  detailTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  reminderDot: { width: 8, height: 8, borderRadius: 4 },
  reminderText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  reminderAmt: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  movList: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  emptyDay: { fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 16 },
});
