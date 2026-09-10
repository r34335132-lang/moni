import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack, rightAction }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {showBack ? (
            <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: '700' }} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 2 }} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {rightAction}
      </View>
    </View>
  );
}
