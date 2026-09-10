import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBankConnections } from '@/src/hooks/useDashboard';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { subscriptionService } from '@/src/services/subscriptionService';

const BELVO_BANKS = ['BBVA', 'Banorte', 'Santander', 'HSBC', 'Nu', 'Scotiabank'];

export default function BankScreen() {
  const { isPremium } = useAuth();
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const { data: connections, isLoading } = useBankConnections();
  const premiumReady = subscriptionService.isConfigured();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('bank.title')} showBack />
      <ScreenContainer>
        <Card style={{ marginBottom: 20, backgroundColor: colors.accent }}>
          <Text style={{ color: colors.accentForeground, fontSize: 14, lineHeight: 20 }}>
            {t('bank.intro')}
          </Text>
        </Card>

        {!premiumReady ? (
          <Card style={{ marginBottom: 20, borderColor: colors.border, borderWidth: 1 }}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{t('bank.unavailableTitle')}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
              {t('bank.unavailableBody')}
            </Text>
          </Card>
        ) : !isPremium && (
          <Card style={{ marginBottom: 20, borderColor: colors.primary, borderWidth: 1 }}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{t('bank.premiumFeature')}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
              {t('bank.premiumRequired')}
            </Text>
          </Card>
        )}

        <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 12 }}>{t('bank.availableBanks')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {BELVO_BANKS.map((bank) => (
            <Pressable
              key={bank}
              disabled={!isPremium || !premiumReady}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: radius,
                backgroundColor: colors.secondary,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: isPremium && premiumReady ? 1 : 0.5,
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: '500' }}>{bank}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 12 }}>{t('bank.connections')}</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : connections?.length ? (
          connections.map((conn) => (
            <Card key={conn.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="business" size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{conn.institution_name}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{conn.status}</Text>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState title={t('bank.empty')} subtitle={t('bank.emptySub')} icon="business-outline" />
        )}
      </ScreenContainer>
    </View>
  );
}
