import React, { useState } from 'react';
import { View, Text, Pressable, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';

interface TimePickerFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function TimePickerField({ label, value, onChange, error }: TimePickerFieldProps) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const fieldLabel = label ?? t('reminders.alertTime');
  const [show, setShow] = useState(false);
  const [tempTime, setTempTime] = useState(value);

  const openPicker = () => {
    setTempTime(value);
    setShow(true);
  };

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selected) onChange(selected);
    } else if (selected) {
      setTempTime(selected);
    }
  };

  const confirmIOS = () => {
    onChange(tempTime);
    setShow(false);
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', marginBottom: 6 }}>{fieldLabel}</Text>
      <Pressable
        onPress={openPicker}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.input,
          borderRadius: radius,
          paddingHorizontal: 14,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: error ? colors.destructive : colors.border,
          gap: 10,
        }}
      >
        <Ionicons name="time-outline" size={22} color={colors.primary} />
        <Text style={{ color: colors.foreground, fontSize: 16, flex: 1 }}>{formatTime(value)}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>
      {error ? <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}

      {Platform.OS === 'android' && show && (
        <DateTimePicker value={value} mode="time" is24Hour={false} display="spinner" onChange={handleChange} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide">
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setShow(false)}>
            <Pressable
              style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 }}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Pressable onPress={() => setShow(false)}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>{t('common.cancel')}</Text>
                </Pressable>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>{fieldLabel}</Text>
                <Pressable onPress={confirmIOS}>
                  <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>{t('common.done')}</Text>
                </Pressable>
              </View>
              <DateTimePicker value={tempTime} mode="time" is24Hour={false} display="spinner" onChange={handleChange} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
