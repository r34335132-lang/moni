import React, { useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useBankConnections } from '@/src/hooks/useDashboard';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card, SectionLabel } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';
import { bankSyncService } from '@/src/services/bankSyncService';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { getErrorMessage } from '@/src/core/utils/errors';
import { formatDate } from '@/src/core/utils/format';
import { AnimatedIn } from '@/src/components/AnimatedIn';

const BELVO_BANKS = ['BBVA', 'Banorte', 'Santander', 'HSBC', 'Nu', 'Scotiabank'];

export default function BankScreen() {
  const { user } = useAuth();
  const { colors, radiusPill } = useTheme();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const { data: connections, isLoading, refetch } = useBankConnections();
  const [connecting, setConnecting] = useState<string | null>(null);

  const activeConnections = (connections ?? []).filter((c) => c.status === 'active');

  const connectBank = async (bank: string) => {
    if (!user) return;
    if (activeConnections.some((c) => c.institution_name === bank)) {
      Alert.alert(t('bank.alreadyConnected'), t('bank.alreadyConnectedBody', { bank }));
      return;
    }
    setConnecting(bank);
    try {
      await bankSyncService.connect(user.id, bank);
      await qc.invalidateQueries({ queryKey: queryKeys.bankConnections });
      await refetch();
      Alert.alert(t('bank.connectedTitle'), t('bank.connectedBody', { bank }));
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = (id: string, name: string) => {
    Alert.alert(t('bank.disconnect'), t('bank.disconnectConfirm', { bank: name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('bank.disconnect'),
        style: 'destructive',
        onPress: async () => {
          try {
            await bankSyncService.disconnect(id);
            await qc.invalidateQueries({ queryKey: queryKeys.bankConnections });
            await refetch();
          } catch (e) {
            Alert.alert(t('common.error'), getErrorMessage(e));
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('bank.title')} showBack />
      <ScreenContainer>
        <AnimatedIn>
          <Card style={{ marginBottom: 18, backgroundColor: colors.accent }} padding={16}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="business" size={22} color={colors.primary} />
              </View>
              <AppText style={{ flex: 1, color: colors.accentForeground, fontSize: 14, lineHeight: 20 }}>
                {t('bank.intro')}
              </AppText>
            </View>
          </Card>
        </AnimatedIn>

        <SectionLabel>{t('bank.availableBanks')}</SectionLabel>
        <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 12, lineHeight: 19 }}>
          {t('bank.connectHint')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {BELVO_BANKS.map((bank) => {
            const linked = activeConnections.some((c) => c.institution_name === bank);
            return (
              <PressableScale
                key={bank}
                disabled={!!connecting || linked}
                onPress={() => connectBank(bank)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: radiusPill,
                  backgroundColor: linked ? colors.accent : colors.card,
                  opacity: connecting && connecting !== bank ? 0.5 : 1,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {connecting === bank ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : linked ? (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                ) : null}
                <AppText style={{ fontFamily: Font.medium }}>{bank}</AppText>
              </PressableScale>
            );
          })}
        </View>

        <SectionLabel>{t('bank.connections')}</SectionLabel>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : activeConnections.length ? (
          activeConnections.map((conn) => (
            <Card key={conn.id} style={{ marginBottom: 10 }} padding={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="business" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontFamily: Font.semibold }}>{conn.institution_name}</AppText>
                  <AppText style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {t('bank.syncActive')}
                    {conn.last_sync_at ? ` · ${formatDate(conn.last_sync_at, 'dd MMM HH:mm')}` : ''}
                  </AppText>
                </View>
                <PressableScale onPress={() => disconnect(conn.id, conn.institution_name)}>
                  <AppText style={{ color: colors.destructive, fontFamily: Font.medium, fontSize: 13 }}>
                    {t('bank.disconnect')}
                  </AppText>
                </PressableScale>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState title={t('bank.empty')} subtitle={t('bank.emptySub')} icon="link-outline" />
        )}
      </ScreenContainer>
    </View>
  );
}
