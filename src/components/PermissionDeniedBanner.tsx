import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';

interface PermissionDeniedBannerProps {
  kind: 'camera' | 'microphone' | 'photos';
  onRetry?: () => void;
}

export function PermissionDeniedBanner({ kind, onRetry }: PermissionDeniedBannerProps) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();

  const title =
    kind === 'camera'
      ? t('transactionForms.cameraDeniedTitle')
      : kind === 'photos'
        ? t('transactionForms.photosDeniedTitle')
        : t('transactionForms.micDeniedTitle');

  const body =
    kind === 'camera'
      ? t('transactionForms.cameraDeniedBody')
      : kind === 'photos'
        ? t('transactionForms.photosDeniedBody')
        : t('transactionForms.micDeniedBody');

  const icon =
    kind === 'camera' ? 'camera-outline' : kind === 'photos' ? 'images-outline' : 'mic-off-outline';

  return (
    <View
      style={{
        backgroundColor: colors.secondary,
        borderRadius: radius,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', marginBottom: 6 }}>
            {title}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20 }}>{body}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Pressable
          onPress={() => Linking.openSettings()}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: radius,
          }}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 13 }}>
            {t('transactionForms.openSettings')}
          </Text>
        </Pressable>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            style={{
              backgroundColor: colors.card,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: radius,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 13 }}>
              {t('common.retry')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
