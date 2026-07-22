import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MovementRow } from '@/components/MovementRow';
import { useMovements } from '@/context/MovementsContext';
import { useProfile } from '@/context/ProfileContext';
import { useColors } from '@/hooks/useColors';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const ACTIONS = [
  { icon: 'add' as const, label: 'Agregar', route: '/add-movement' },
  { icon: 'chatbubble-ellipses' as const, label: 'Moni', route: '/(tabs)/chat' },
  { icon: 'camera' as const, label: 'Ticket', route: '/add-movement?mode=camera' },
  { icon: 'alarm' as const, label: 'Avisos', route: '/reminders' },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { movements } = useMovements();
  const { profile } = useProfile();

  const now = new Date();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { income, expenses, balance } = useMemo(() => {
    const monthly = movements.filter((m) => {
      const d = new Date(m.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = monthly.filter((m) => m.type === 'income').reduce((s, m) => s + m.amount, 0);
    const expenses = monthly.filter((m) => m.type === 'expense').reduce((s, m) => s + m.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [movements]);

  const recent = movements.slice(0, 6);
  const monthLabel = now.toLocaleDateString('es-MX', { month: 'long' });
  const isNegative = balance < 0;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 20, paddingBottom: botPad + 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{profile.name}</Text>
        </View>
        <Pressable
          style={[styles.avatar, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/profile' as any)}
        >
          <Text style={styles.avatarLetter}>{profile.name.charAt(0).toUpperCase()}</Text>
        </Pressable>
      </View>

      {/* Hero balance */}
      <View style={styles.balanceSection}>
        <Text style={[styles.balancePeriod, { color: colors.mutedForeground }]}>
          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} · balance
        </Text>
        <Text
          style={[
            styles.balanceAmount,
            { color: isNegative ? colors.destructive : colors.foreground },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {isNegative ? '-' : ''}{profile.currencySymbol}{Math.abs(balance).toLocaleString('es-MX')}
        </Text>
        <View style={styles.balanceStats}>
          <View style={styles.balanceStat}>
            <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.balanceStatLabel, { color: colors.mutedForeground }]}>Ingresos</Text>
            <Text style={[styles.balanceStatValue, { color: '#22C55E' }]}>
              {profile.currencySymbol}{income.toLocaleString('es-MX')}
            </Text>
          </View>
          <View style={[styles.balanceStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.balanceStat}>
            <View style={[styles.dot, { backgroundColor: colors.destructive }]} />
            <Text style={[styles.balanceStatLabel, { color: colors.mutedForeground }]}>Gastos</Text>
            <Text style={[styles.balanceStatValue, { color: colors.foreground }]}>
              {profile.currencySymbol}{expenses.toLocaleString('es-MX')}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Quick actions — circular row */}
      <View style={styles.actionsRow}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.label}
            style={styles.actionWrap}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(a.route as any);
            }}
          >
            {({ pressed }) => (
              <>
                <View
                  style={[
                    styles.actionCircle,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    pressed && { backgroundColor: colors.muted },
                  ]}
                >
                  <Ionicons name={a.icon} size={22} color={colors.foreground} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>{a.label}</Text>
              </>
            )}
          </Pressable>
        ))}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Recent movements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recientes</Text>
          <Pressable onPress={() => router.push('/(tabs)/movements' as any)}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todos</Text>
          </Pressable>
        </View>

        {recent.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Sin movimientos aún</Text>
          </View>
        ) : (
          <View style={[styles.movementList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recent.map((m, i) => (
              <MovementRow
                key={m.id}
                movement={m}
                showSeparator={i < recent.length - 1}
                onPress={() => router.push(`/add-movement?id=${m.id}` as any)}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 36,
  },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

  balanceSection: { paddingHorizontal: 24, marginBottom: 32 },
  balancePeriod: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 8, letterSpacing: 0.2 },
  balanceAmount: {
    fontSize: 56,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -2,
    lineHeight: 60,
    marginBottom: 20,
  },
  balanceStats: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  balanceStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceStatDivider: { width: 1, height: 20, marginHorizontal: 16 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  balanceStatLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  balanceStatValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginLeft: 2 },

  divider: { height: 1, marginVertical: 4 },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  actionWrap: { alignItems: 'center', gap: 8 },
  actionCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },

  section: { paddingHorizontal: 24, paddingTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  movementList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyWrap: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
