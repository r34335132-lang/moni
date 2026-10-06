import React, { useState } from 'react';
import { View, Pressable, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, getFormatLocale } from '@/src/core/utils/format';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { AppText, Font } from '@/src/components/ui/AppText';

interface DatePickerFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  error?: string;
}

export function DatePickerField({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
  error,
}: DatePickerFieldProps) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const fieldLabel = label ?? t('common.date');
  const pickerLocale = getFormatLocale() === 'en' ? 'en-US' : 'es-MX';
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const openPicker = () => {
    setTempDate(value);
    setShow(true);
  };

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selected) onChange(selected);
    } else if (selected) {
      setTempDate(selected);
    }
  };

  const confirmIOS = () => {
    onChange(tempDate);
    setShow(false);
  };

  return (
    <View style={{ marginBottom: 14 }}>
      {fieldLabel ? (
        <AppText style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: Font.semibold, marginBottom: 8 }}>
          {fieldLabel}
        </AppText>
      ) : null}
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
          <Ionicons name="calendar" size={18} color={colors.primary} />
        </View>
        <AppText style={{ color: colors.foreground, fontSize: 16, flex: 1, fontFamily: Font.medium }}>
          {formatDate(value, 'EEEE, d MMMM yyyy')}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>
      {error ? (
        <AppText style={{ color: colors.destructive, fontSize: 12, marginTop: 4 }}>{error}</AppText>
      ) : null}

      {Platform.OS === 'android' && show ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="calendar"
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
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
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                onChange={handleChange}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                locale={pickerLocale}
                themeVariant={colors.background === '#0A0A0B' || colors.background === '#0A0A0A' ? 'dark' : 'light'}
                style={{ alignSelf: 'center' }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
