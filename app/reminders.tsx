import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXPENSE_CATEGORIES, getCategoryById } from '@/constants/categories';
import { useReminders, type Reminder } from '@/context/RemindersContext';
import { useColors } from '@/hooks/useColors';

export default function RemindersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { reminders, addReminder, updateReminder, deleteReminder } = useReminders();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDay, setNewDay] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('servicios');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleToggle = async (id: string, current: boolean) => {
    Haptics.selectionAsync();
    await updateReminder(id, { active: !current });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar recordatorio', '¿Deseas eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteReminder(id) },
    ]);
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Título requerido');
      return;
    }
    const day = parseInt(newDay);
    if (!day || day < 1 || day > 31) {
      Alert.alert('Día inválido', 'Ingresa un día del 1 al 31.');
      return;
    }
    await addReminder({
      title: newTitle.trim(),
      dueDay: day,
      amount: parseFloat(newAmount) || 0,
      category: newCategory,
      active: true,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
    setNewTitle('');
    setNewDay('');
    setNewAmount('');
    setNewCategory('servicios');
  };

  const getOrdinal = (n: number) => `día ${n}`;

  const renderItem = ({ item }: { item: Reminder }) => {
    const cat = getCategoryById(item.category);
    const now = new Date();
    const daysUntil = item.dueDay - now.getDate();
    const dueSoon = daysUntil >= 0 && daysUntil <= 3;
    const overdue = daysUntil < 0;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          !item.active && { opacity: 0.55 },
        ]}
      >
        <View style={[styles.cardIcon, { backgroundColor: (cat?.color ?? colors.primary) + '22' }]}>
          <Ionicons name={cat?.icon ?? 'alarm-outline'} size={22} color={cat?.color ?? colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <Text style={[styles.cardDay, { color: overdue ? colors.destructive : dueSoon ? '#F59E0B' : colors.mutedForeground }]}>
              {getOrdinal(item.dueDay)} de cada mes
              {dueSoon && !overdue ? ' · Próximamente' : ''}
              {overdue ? ' · Vencido' : ''}
            </Text>
            {item.amount > 0 && (
              <Text style={[styles.cardAmount, { color: colors.mutedForeground }]}>
                · ${item.amount.toLocaleString('es-MX')}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.cardActions}>
          <Switch
            value={item.active}
            onValueChange={() => handleToggle(item.id, item.active)}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={item.active ? colors.primary : colors.mutedForeground}
          />
          <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Recordatorios</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: botPad + 40, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="alarm-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin recordatorios</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Agrega recordatorios para pagar tus servicios a tiempo
            </Text>
          </View>
        }
      />

      {/* Add modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.mutedForeground }]}>Cancelar</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nuevo recordatorio</Text>
            <Pressable onPress={handleAdd}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Guardar</Text>
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NOMBRE</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              placeholder="Ej: Luz, Renta, Netflix..."
              placeholderTextColor={colors.mutedForeground}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DÍA DEL MES</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              placeholder="Ej: 15"
              placeholderTextColor={colors.mutedForeground}
              value={newDay}
              onChangeText={setNewDay}
              keyboardType="number-pad"
              maxLength={2}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>MONTO (OPCIONAL)</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CATEGORÍA</Text>
            <View style={styles.catRow}>
              {EXPENSE_CATEGORIES.slice(0, 8).map((c) => (
                <Pressable
                  key={c.id}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: newCategory === c.id ? c.color + '25' : colors.muted,
                      borderColor: newCategory === c.id ? c.color : colors.border,
                    },
                  ]}
                  onPress={() => setNewCategory(c.id)}
                >
                  <Ionicons name={c.icon} size={16} color={newCategory === c.id ? c.color : colors.mutedForeground} />
                  <Text style={[styles.catChipText, { color: newCategory === c.id ? c.color : colors.foreground }]}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_500Medium', marginBottom: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDay: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  cardAmount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteBtn: { padding: 6 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  modalCancel: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  modalSave: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  modalBody: { padding: 20, gap: 6 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  fieldInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  catChipText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
