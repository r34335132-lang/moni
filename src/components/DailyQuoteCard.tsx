import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { getQuoteForDay } from '@/src/core/constants/motivationalQuotes';
import { notificationService } from '@/src/services/notificationService';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';

export function DailyQuoteCard() {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const quote = getQuoteForDay();

  const handleNotify = async () => {
    const sent = await notificationService.sendInstantQuote();
    if (sent) {
      Alert.alert(t('common.saved'), t('dashboard.quoteSent'));
    } else {
      Alert.alert(t('common.notice'), t('dashboard.quoteAlreadySent'));
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius,
        padding: 18,
        marginBottom: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <AppText variant="label" style={{ color: colors.mutedForeground, textTransform: 'uppercase' }}>
          {t('dashboard.dailyQuote')}
        </AppText>
        <PressableScale onPress={handleNotify} scaleTo={0.9} hitSlop={10} accessibilityLabel={t('dashboard.dailyQuote')}>
          <Ionicons name="paper-plane-outline" size={20} color={colors.mutedForeground} />
        </PressableScale>
      </View>
      <AppText
        style={{
          color: colors.foreground,
          fontFamily: Font.medium,
          fontSize: 17,
          lineHeight: 26,
        }}
      >
        {quote}
      </AppText>
    </View>
  );
}
