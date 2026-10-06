import React, { useState } from 'react';
import { View, Pressable, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { AppText, Font } from '@/src/components/ui/AppText';

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
      <AppText style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: Font.semibold, marginBottom: 8 }}>
        {fieldLabel}
      </AppText>
      <Pressable
        onPress={openPicker}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.fill,
          borderRadius: radius,
          paddingHorizontal: 14,
          paddingVertical: 15,
          borderWidth: error ? 1.5 : 0,
          borderColor: error ? colors.destructive : 'transparent',
          gap: 10,
          minHeight: 54,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="time" size={18} color={colors.primary} />
        </View>
        <AppText style={{ color: colors.foreground, fontSize: 16, flex: 1, fontFamily: Font.medium }}>
          {formatTime(value)}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>
      {error ? <AppText style={{ color: colors.destructive, fontSize: 12, marginTop: 4 }}>{error}</AppText> : null}

      {Platform.OS === 'android' && show ? (
        <DateTimePicker value={value} mode="time" is24Hour={false} display="spinner" onChange={handleChange} />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide">
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
            onPress={() => setShow(false)}
          >
            <Pressable
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingBottom: 34,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                }}
              >
                <Pressable onPress={() => setShow(false)}>
                  <AppText style={{ color: colors.mutedForeground, fontSize: 16 }}>{t('common.cancel')}</AppText>
                </Pressable>
                <AppText style={{ fontFamily: Font.semibold, fontSize: 16 }}>{fieldLabel}</AppText>
                <Pressable onPress={confirmIOS}>
                  <AppText style={{ color: colors.primary, fontSize: 16, fontFamily: Font.semibold }}>
                    {t('common.done')}
                  </AppText>
                </Pressable>
              </View>
              <DateTimePicker value={tempTime} mode="time" display="spinner" onChange={handleChange} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
