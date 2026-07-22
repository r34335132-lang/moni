import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryById } from '@/constants/categories';
import { useMovements } from '@/context/MovementsContext';
import { useProfile } from '@/context/ProfileContext';
import { useColors } from '@/hooks/useColors';

type EntryMode = 'manual' | 'voice' | 'camera';
type MovementType = 'expense' | 'income';

export default function AddMovementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { movements, addMovement, updateMovement, deleteMovement } = useMovements();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();

  const existing = params.id ? movements.find((m) => m.id === params.id) : undefined;
  const isEdit = !!existing;

  const [mode, setMode] = useState<EntryMode>((params.mode as EntryMode) ?? 'manual');
  const [type, setType] = useState<MovementType>(existing?.type ?? 'expense');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [voiceText, setVoiceText] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const amountRef = useRef<TextInput>(null);

  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (mode === 'manual') {
      setTimeout(() => amountRef.current?.focus(), 300);
    }
  }, [mode]);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const selectedCategory = getCategoryById(category);

  const handleSave = async () => {
    const amt = parseFloat(amount.replace(/,/g, ''));
    if (!amt || amt <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a cero.');
      return;
    }
    if (!category) {
      Alert.alert('Categoría requerida', 'Selecciona una categoría.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const data = {
      type,
      amount: amt,
      category,
      description: description.trim() || selectedCategory?.name || '',
      date: new Date().toISOString(),
    };

    if (isEdit && existing) {
      await updateMovement(existing.id, data);
    } else {
      await addMovement(data);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Eliminar movimiento', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteMovement(existing.id);
          router.back();
        },
      },
    ]);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para escanear tickets.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      setMode('camera');
      Alert.alert('Imagen capturada', 'Ingresa los datos del ticket manualmente para guardar el movimiento.', [
        { text: 'OK' }
      ]);
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const parseVoice = () => {
    const text = voiceText.toLowerCase();
    // Try to extract amount
    const amountMatch = text.match(/(\d+(?:[,.]?\d+)?)\s*(pesos?|mxn|dólares?|euros?)?/);
    if (amountMatch) setAmount(amountMatch[1].replace(',', ''));

    // Try to detect type
    if (text.includes('gané') || text.includes('me pagaron') || text.includes('cobré') || text.includes('ingreso')) {
      setType('income');
    } else {
      setType('expense');
    }

    // Try to detect category
    const catMap: Record<string, string> = {
      gasolina: 'gasolina', comida: 'comida', supermercado: 'supermercado',
      restaurante: 'restaurantes', ropa: 'ropa', farmacia: 'farmacia',
      salud: 'salud', escuela: 'escuela', servicios: 'servicios',
      casa: 'casa', viajes: 'viajes', entretenimiento: 'entretenimiento',
      sueldo: 'sueldo', freelance: 'freelance',
    };
    for (const [keyword, catId] of Object.entries(catMap)) {
      if (text.includes(keyword)) { setCategory(catId); break; }
    }

    setDescription(voiceText);
    setMode('manual');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}
        </Text>
        {isEdit && (
          <Pressable onPress={handleDelete} style={styles.backBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          </Pressable>
        )}
      </View>

      {/* Mode tabs */}
      {!isEdit && (
        <View style={[styles.modeTabs, { backgroundColor: colors.muted }]}>
          {(['manual', 'voice', 'camera'] as EntryMode[]).map((m) => {
            const icons: Record<EntryMode, keyof typeof Ionicons.glyphMap> = {
              manual: 'create-outline', voice: 'mic-outline', camera: 'camera-outline',
            };
            const labels: Record<EntryMode, string> = { manual: 'Manual', voice: 'Voz', camera: 'Foto' };
            return (
              <Pressable
                key={m}
                style={[styles.modeTab, mode === m && [styles.modeTabActive, { backgroundColor: colors.background }]]}
                onPress={() => {
                  if (m === 'camera') { handleCamera(); return; }
                  setMode(m);
                }}
              >
                <Ionicons name={icons[m]} size={16} color={mode === m ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.modeLabel, { color: mode === m ? colors.primary : colors.mutedForeground }]}>
                  {labels[m]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 20, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {mode === 'voice' ? (
          <View style={styles.voiceSection}>
            <View style={[styles.voiceBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="mic-outline" size={48} color={colors.primary} />
              <Text style={[styles.voiceHint, { color: colors.mutedForeground }]}>
                Escribe lo que dirías en voz alta
              </Text>
              <Text style={[styles.voiceExample, { color: colors.mutedForeground }]}>
                Ejemplo: "Gasté 250 pesos en gasolina"
              </Text>
            </View>
            <TextInput
              style={[styles.voiceInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              placeholder="Escribe aquí tu movimiento..."
              placeholderTextColor={colors.mutedForeground}
              value={voiceText}
              onChangeText={setVoiceText}
              multiline
              autoFocus
              numberOfLines={4}
            />
            <Pressable
              style={[styles.parseBtn, { backgroundColor: voiceText.trim() ? colors.primary : colors.muted }]}
              onPress={parseVoice}
              disabled={!voiceText.trim()}
            >
              <Text style={[styles.parseBtnText, { color: voiceText.trim() ? '#fff' : colors.mutedForeground }]}>
                Continuar
              </Text>
              <Ionicons name="arrow-forward" size={18} color={voiceText.trim() ? '#fff' : colors.mutedForeground} />
            </Pressable>
          </View>
        ) : (
          <>
            {/* Photo preview */}
            {photo && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
                <Pressable style={styles.removePhoto} onPress={() => setPhoto(null)}>
                  <Ionicons name="close-circle" size={24} color={colors.destructive} />
                </Pressable>
              </View>
            )}

            {/* Type toggle */}
            <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
              <Pressable
                style={[styles.typeBtn, type === 'expense' && [styles.typeBtnActive, { backgroundColor: colors.destructive }]]}
                onPress={() => { setType('expense'); setCategory(''); }}
              >
                <Text style={[styles.typeBtnText, { color: type === 'expense' ? '#fff' : colors.mutedForeground }]}>Gasto</Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, type === 'income' && [styles.typeBtnActive, { backgroundColor: '#22C55E' }]]}
                onPress={() => { setType('income'); setCategory(''); }}
              >
                <Text style={[styles.typeBtnText, { color: type === 'income' ? '#fff' : colors.mutedForeground }]}>Ingreso</Text>
              </Pressable>
            </View>

            {/* Amount */}
            <View style={styles.amountSection}>
              <Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>{profile.currencySymbol}</Text>
              <TextInput
                ref={amountRef}
                style={[styles.amountInput, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={colors.border}
                keyboardType="decimal-pad"
                maxLength={10}
              />
            </View>

            {/* Description */}
            <TextInput
              style={[styles.descInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              placeholder="Descripción (opcional)"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              maxLength={80}
            />

            {/* Category grid */}
            <Text style={[styles.catLabel, { color: colors.mutedForeground }]}>CATEGORÍA</Text>
            <View style={styles.catGrid}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={({ pressed }) => [
                    styles.catItem,
                    {
                      backgroundColor: category === cat.id ? cat.color + '25' : colors.card,
                      borderColor: category === cat.id ? cat.color : colors.border,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(cat.id);
                  }}
                >
                  <Ionicons name={cat.icon} size={22} color={category === cat.id ? cat.color : colors.mutedForeground} />
                  <Text
                    style={[
                      styles.catName,
                      { color: category === cat.id ? cat.color : colors.foreground },
                    ]}
                    numberOfLines={2}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Save button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: type === 'income' ? '#22C55E' : colors.destructive },
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleSave}
            >
              <Ionicons name={isEdit ? 'checkmark' : 'add'} size={22} color="#fff" />
              <Text style={styles.saveBtnText}>{isEdit ? 'Guardar cambios' : `Registrar ${type === 'income' ? 'ingreso' : 'gasto'}`}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 36 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  modeTabs: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  modeTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  voiceSection: { paddingTop: 20, gap: 16 },
  voiceBox: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  voiceHint: { fontSize: 16, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  voiceExample: { fontSize: 13, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  voiceInput: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  parseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  parseBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  photoPreview: { marginVertical: 12, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  photo: { width: '100%', height: 180, borderRadius: 16 },
  removePhoto: { position: 'absolute', top: 8, right: 8 },
  typeToggle: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 8, marginTop: 4 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  typeBtnActive: {},
  typeBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  amountSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  currencySymbol: { fontSize: 36, fontFamily: 'Inter_400Regular', marginRight: 4, marginTop: 8 },
  amountInput: { fontSize: 60, textAlign: 'center', minWidth: 180, letterSpacing: -2 },
  descInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  catLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  catItem: {
    width: '30%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  catName: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 18,
    marginBottom: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
});
