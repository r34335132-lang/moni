import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { getQuoteForDay } from '@/src/core/constants/motivationalQuotes';
import { notificationService } from '@/src/services/notificationService';

interface DailyQuoteCardProps {
  onShare?: () => void;
}

export function DailyQuoteCard({ onShare }: DailyQuoteCardProps) {
  const { colors, radius } = useTheme();
  const quote = getQuoteForDay();
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );

  const handleNotify = async () => {
    const sent = await notificationService.sendInstantQuote();
    if (sent) {
      Alert.alert('Enviada', 'Frase del día enviada (solo una por día).');
    } else {
      Alert.alert('Ya enviada', 'Hoy ya recibiste la frase del día.');
    }
    onShare?.();
  };

  return (
    <View
      style={{
        backgroundColor: colors.accent,
        borderRadius: radius,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
            Frase del día #{dayOfYear}
          </Text>
        </View>
        <Pressable onPress={handleNotify} hitSlop={8}>
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>
      <Text style={{ color: colors.foreground, fontSize: 16, lineHeight: 24, fontWeight: '500' }}>
        "{quote}"
      </Text>
    </View>
  );
}
