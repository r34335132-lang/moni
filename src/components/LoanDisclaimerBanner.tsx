import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { AppText, Font } from '@/src/components/ui/AppText';

/** Store-review disclaimer: personal debt tracking only, not a lending product. */
export function LoanDisclaimerBanner() {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: colors.card,
        borderRadius: radius,
        padding: 14,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(245,158,11,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="information" size={18} color="#B45309" />
      </View>
      <AppText style={{ flex: 1, color: colors.mutedForeground, fontSize: 13, lineHeight: 19, fontFamily: Font.medium }}>
        {t('loans.disclaimer')}
      </AppText>
    </View>
  );
}
