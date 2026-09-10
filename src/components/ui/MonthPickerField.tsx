import React, { useState } from 'react';
import { View, Text, Pressable, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, getFormatLocale } from '@/src/core/utils/format';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';

interface MonthPickerFieldProps {
  label?: string;
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthPickerField({ label, month, year, onChange }: MonthPickerFieldProps) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const fieldLabel = label ?? t('reports.monthLabel');
  const pickerLocale = getFormatLocale() === 'en' ? 'en-US' : 'es-MX';
  const [show, setShow] = useState(false);
  const value = new Date(year, month - 1, 1);
  const [tempDate, setTempDate] = useState(value);

  const openPicker = () => {
    setTempDate(value);
    setShow(true);
  };

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selected) onChange(selected.getMonth() + 1, selected.getFullYear());
    } else if (selected) {
      setTempDate(selected);
    }
  };

  const confirmIOS = () => {
    onChange(tempDate.getMonth() + 1, tempDate.getFullYear());
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
          borderColor: colors.border,
          gap: 10,
        }}
      >
        <Ionicons name="calendar-outline" size={22} color={colors.primary} />
        <Text style={{ color: colors.foreground, fontSize: 16, flex: 1, textTransform: 'capitalize' }}>
          {formatDate(value, 'MMMM yyyy')}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>

      {Platform.OS === 'android' && show && (
        <DateTimePicker value={value} mode="date" display="default" onChange={handleChange} />
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
              <DateTimePicker value={tempDate} mode="date" display="inline" onChange={handleChange} locale={pickerLocale} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
