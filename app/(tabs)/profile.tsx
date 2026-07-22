import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMovements } from '@/context/MovementsContext';
import { useProfile } from '@/context/ProfileContext';
import { useColors } from '@/hooks/useColors';

const CURRENCIES = [
  { code: 'MXN', symbol: '$', label: 'Peso mexicano' },
  { code: 'USD', symbol: '$', label: 'Dólar americano' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'COP', symbol: '$', label: 'Peso colombiano' },
  { code: 'ARS', symbol: '$', label: 'Peso argentino' },
];

function SettingsRow({
  icon, iconColor, label, right, onPress, danger, noBorder,
}: {
  icon: string; iconColor?: string; label: string; right?: React.ReactNode;
  onPress?: () => void; danger?: boolean; noBorder?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !noBorder && [styles.rowBorder, { borderBottomColor: colors.border }],
        pressed && onPress && { backgroundColor: colors.muted },
      ]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? colors.mutedForeground) + '18' }]}>
        <Ionicons name={icon as any} size={16} color={iconColor ?? colors.mutedForeground} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
      <View style={styles.rowRight}>{right ?? (onPress && (
        <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
      ))}</View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useProfile();
  const { movements } = useMovements();
  const colorScheme = useColorScheme();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = movements.filter((m) => {
      const d = new Date(m.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = thisMonth.filter((m) => m.type === 'income').reduce((s, m) => s + m.amount, 0);
    const expenses = thisMonth.filter((m) => m.type === 'expense').reduce((s, m) => s + m.amount, 0);
    return { income, expenses, balance: income - expenses, total: movements.length };
  }, [movements]);

  const handleSaveName = async () => {
    if (nameInput.trim()) await updateProfile({ name: nameInput.trim() });
    setEditingName(false);
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad + 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.profileHeader, { paddingTop: topPad + 24 }]}>
        <Pressable
          style={[styles.bigAvatar, { backgroundColor: colors.primary }]}
          onPress={() => { setEditingName(true); setNameInput(profile.name); }}
        >
          <Text style={styles.bigAvatarLetter}>{profile.name.charAt(0).toUpperCase()}</Text>
        </Pressable>
        {editingName ? (
          <TextInput
            style={[styles.nameEdit, { color: colors.foreground, borderBottomColor: colors.primary, fontFamily: 'Inter_700Bold' }]}
            value={nameInput}
            onChangeText={setNameInput}
            autoFocus
            onBlur={handleSaveName}
            returnKeyType="done"
            onSubmitEditing={handleSaveName}
            textAlign="center"
          />
        ) : (
          <Pressable onPress={() => { setEditingName(true); setNameInput(profile.name); }} style={styles.nameRow}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name}</Text>
            <Ionicons name="pencil" size={13} color={colors.mutedForeground} />
          </Pressable>
        )}
        <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>
          {stats.total} movimientos registrados
        </Text>
      </View>

      {/* Quick stats strip */}
      <View style={[styles.statsStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: '#22C55E' }]}>
            ${stats.income.toLocaleString('es-MX')}
          </Text>
          <Text style={[styles.stripLabel, { color: colors.mutedForeground }]}>Ingresos</Text>
        </View>
        <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: colors.foreground }]}>
            ${stats.expenses.toLocaleString('es-MX')}
          </Text>
          <Text style={[styles.stripLabel, { color: colors.mutedForeground }]}>Gastos</Text>
        </View>
        <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: stats.balance >= 0 ? '#22C55E' : colors.destructive }]}>
            ${Math.abs(stats.balance).toLocaleString('es-MX')}
          </Text>
          <Text style={[styles.stripLabel, { color: colors.mutedForeground }]}>Balance</Text>
        </View>
      </View>

      {/* Currency */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Moneda</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {CURRENCIES.map((c, i) => (
            <SettingsRow
              key={c.code}
              icon="cash-outline"
              iconColor={colors.primary}
              label={`${c.label} (${c.code})`}
              noBorder={i === CURRENCIES.length - 1}
              onPress={async () => {
                Haptics.selectionAsync();
                await updateProfile({ currency: c.code, currencySymbol: c.symbol });
              }}
              right={
                profile.currency === c.code
                  ? <Ionicons name="checkmark" size={16} color={colors.primary} />
                  : null
              }
            />
          ))}
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Apariencia</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon={colorScheme === 'dark' ? 'moon' : 'sunny'}
            iconColor="#F59E0B"
            label={colorScheme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
            noBorder
            right={<Text style={[styles.autoText, { color: colors.mutedForeground }]}>Automático</Text>}
          />
        </View>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Datos</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="download-outline"
            iconColor={colors.primary}
            label="Exportar datos"
            onPress={() => Alert.alert('Exportar datos', 'Próximamente.')}
          />
          <SettingsRow
            icon="trash-outline"
            iconColor={colors.destructive}
            label="Eliminar todos los datos"
            noBorder
            danger
            onPress={() =>
              Alert.alert('Eliminar datos', '¿Estás seguro? No se puede deshacer.', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar',
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.multiRemove([
                      '@moni_movements_v2', '@moni_init_v2',
                      '@moni_reminders_v2', '@moni_reminders_init_v2', '@moni_chat_v2',
                    ]);
                    Alert.alert('Listo', 'Reinicia la app para ver los cambios.');
                  },
                },
              ])
            }
          />
        </View>
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>MONI · Tu dinero bajo control</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  profileHeader: { alignItems: 'center', gap: 8, paddingBottom: 24, paddingHorizontal: 24 },
  bigAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  bigAvatarLetter: { color: '#fff', fontSize: 28, fontFamily: 'Inter_700Bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  nameEdit: {
    fontSize: 24,
    borderBottomWidth: 2,
    paddingBottom: 2,
    width: 200,
    textAlign: 'center',
  },
  profileSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
  },
  stripItem: { flex: 1, paddingVertical: 16, alignItems: 'center', gap: 4 },
  stripDivider: { width: 1 },
  stripValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  stripLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  section: { paddingHorizontal: 24, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  rowRight: { minWidth: 20, alignItems: 'flex-end' },
  autoText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  version: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', paddingVertical: 20 },
});
