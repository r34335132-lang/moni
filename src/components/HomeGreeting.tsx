import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { AppText, Font } from '@/src/components/ui/AppText';
import { formatDate } from '@/src/core/utils/format';

interface HomeGreetingProps {
  name?: string | null;
}

function greetingKey(hour: number): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  if (hour < 12) return 'goodMorning';
  if (hour < 19) return 'goodAfternoon';
  return 'goodEvening';
}

export function HomeGreeting({ name }: HomeGreetingProps) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const firstName = (name?.trim().split(/\s+/)[0] || t('common.user')).replace(/^./, (c) => c.toUpperCase());
  const initial = firstName.charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const greet = t(`dashboard.${greetingKey(hour)}`);
  const dateLabel = useMemo(() => formatDate(new Date(), 'EEEE d MMMM'), []);

  return (
    <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText style={{ color: colors.primaryForeground, fontFamily: Font.bold, fontSize: 22 }}>
            {initial}
          </AppText>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText
            variant="caption"
            style={{
              color: colors.mutedForeground,
              fontFamily: Font.medium,
              textTransform: 'capitalize',
            }}
            numberOfLines={1}
          >
            {dateLabel}
          </AppText>
          <AppText
            style={{
              color: colors.foreground,
              fontFamily: Font.bold,
              fontSize: 26,
              lineHeight: 32,
              letterSpacing: -0.4,
              marginTop: 2,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {greet}, {firstName}
          </AppText>
          <AppText
            variant="callout"
            style={{ color: colors.mutedForeground, marginTop: 2 }}
            numberOfLines={2}
          >
            {t('dashboard.welcomeSubtitle')}
          </AppText>
        </View>
      </View>

      <View
        style={{
          marginTop: 14,
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.separator,
          borderRadius: radius,
        }}
      />
    </View>
  );
}
