import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onClear,
}: SearchBarProps) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const resolvedPlaceholder = placeholder ?? t('common.searchPlaceholder');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.input,
        borderRadius: radius,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
      }}
    >
      <Ionicons name="search" size={20} color={colors.mutedForeground} />
      <TextInput
        placeholder={resolvedPlaceholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          paddingVertical: 12,
          fontSize: 15,
          color: colors.foreground,
        }}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: radius,
        backgroundColor: active ? colors.primary : colors.secondary,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: active ? colors.primaryForeground : colors.foreground,
          fontWeight: '600',
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
