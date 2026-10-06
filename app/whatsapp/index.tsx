import React, { useCallback, useEffect, useState } from 'react';
import { View, Alert, ActivityIndicator, Share, Platform, Linking, AppState } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card, SectionLabel } from '@/src/components/ui/Card';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { Button } from '@/src/components/ui/Button';
import { PressableScale } from '@/src/components/ui/Glass';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { AppText, Font } from '@/src/components/ui/AppText';
import { whatsappService } from '@/src/services/whatsappService';
import { getErrorMessage } from '@/src/core/utils/errors';
import { formatDate } from '@/src/core/utils/format';

export default function WhatsAppLinkScreen() {
  const { user, refreshProfile } = useAuth();
  const { colors, radiusPill } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [linkedAt, setLinkedAt] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const businessNumber = whatsappService.businessNumber();

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const status = await whatsappService.getLinkStatus(user.id);
      setPhone(status.phone_e164);
      setLinkedAt(status.whatsapp_linked_at);
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Coming back from WhatsApp after sending the code: refresh so the screen shows "Linked".
  useEffect(() => {
    if (!code || phone) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });
    return () => sub.remove();
  }, [code, phone, reload]);

  const openWhatsApp = async (linkCode: string) => {
    const url = whatsappService.chatUrl(`VINCULAR ${linkCode}`);
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('common.error'), t('whatsapp.openFail'));
    }
  };

  const generateCode = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const result = await whatsappService.createLinkCode(user.id);
      setCode(result.code);
      setExpiresAt(result.expiresAt);
      await openWhatsApp(result.code);
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    const msg = `VINCULAR ${code}`;
    try {
      await Clipboard.setStringAsync(msg);
      Alert.alert(t('common.done'), t('whatsapp.copied'));
    } catch {
      await Share.share({ message: msg });
    }
  };

  const unlink = () => {
    if (!user) return;
    Alert.alert(t('whatsapp.unlink'), t('whatsapp.unlinkConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('whatsapp.unlink'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await whatsappService.unlink(user.id);
            setPhone(null);
            setLinkedAt(null);
            setCode(null);
            await refreshProfile();
          } catch (e) {
            Alert.alert(t('common.error'), getErrorMessage(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('whatsapp.title')} showBack />
      <ScreenContainer>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
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
                    <Ionicons name="logo-whatsapp" size={24} color={colors.primary} />
                  </View>
                  <AppText style={{ flex: 1, color: colors.accentForeground, fontSize: 14, lineHeight: 20 }}>
                    {t('whatsapp.intro')}
                  </AppText>
                </View>
              </Card>
            </AnimatedIn>

            <SectionLabel>{t('whatsapp.status')}</SectionLabel>
            <AnimatedIn index={1}>
              <Card style={{ marginBottom: 18 }} padding={16}>
                {phone ? (
                  <>
                    <AppText style={{ fontFamily: Font.semibold, fontSize: 16 }}>
                      {t('whatsapp.linked')}
                    </AppText>
                    <AppText style={{ color: colors.mutedForeground, marginTop: 6, fontSize: 14 }}>
                      {phone}
                      {linkedAt ? ` · ${formatDate(linkedAt, 'dd MMM yyyy HH:mm')}` : ''}
                    </AppText>
                    <View style={{ marginTop: 14 }}>
                      <Button title={t('whatsapp.unlink')} variant="destructive" onPress={unlink} disabled={busy} />
                    </View>
                  </>
                ) : (
                  <AppText style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20 }}>
                    {t('whatsapp.notLinked')}
                  </AppText>
                )}
              </Card>
            </AnimatedIn>

            {!phone ? (
              <>
                <SectionLabel>{t('whatsapp.linkSteps')}</SectionLabel>
                <AnimatedIn index={2}>
                  <Card style={{ marginBottom: 14 }} padding={16}>
                    <AppText style={{ fontSize: 14, lineHeight: 21, color: colors.foreground }}>
                      {t('whatsapp.step1')}
                    </AppText>
                    {businessNumber ? (
                      <AppText style={{ marginTop: 10, fontFamily: Font.semibold, fontSize: 16 }}>
                        {businessNumber}
                      </AppText>
                    ) : (
                      <AppText style={{ marginTop: 10, color: colors.mutedForeground, fontSize: 13 }}>
                        {t('whatsapp.numberPending')}
                      </AppText>
                    )}
                  </Card>
                </AnimatedIn>

                <AnimatedIn index={3}>
                  <PrimarySaveButton
                    title={t('whatsapp.generateCode')}
                    onPress={generateCode}
                    loading={busy}
                    disabled={busy}
                    icon="logo-whatsapp"
                  />
                </AnimatedIn>

                {code ? (
                  <AnimatedIn index={4}>
                    <Card style={{ marginTop: 16 }} padding={18}>
                      <AppText style={{ color: colors.mutedForeground, fontSize: 13 }}>
                        {t('whatsapp.sendThis')}
                      </AppText>
                      <PressableScale
                        onPress={copyCode}
                        style={{
                          marginTop: 10,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderRadius: radiusPill,
                          backgroundColor: colors.fill,
                          alignItems: 'center',
                        }}
                      >
                        <AppText style={{ fontFamily: Font.bold, fontSize: 22, letterSpacing: 1 }}>
                          VINCULAR {code}
                        </AppText>
                      </PressableScale>
                      {expiresAt ? (
                        <AppText style={{ marginTop: 10, color: colors.mutedForeground, fontSize: 12 }}>
                          {t('whatsapp.expires', { time: formatDate(expiresAt, 'HH:mm') })}
                        </AppText>
                      ) : null}
                      {businessNumber ? (
                        <View style={{ marginTop: 14 }}>
                          <Button
                            title={t('whatsapp.openWhatsApp')}
                            onPress={() => openWhatsApp(code)}
                            disabled={busy}
                          />
                        </View>
                      ) : null}
                      <AppText
                        style={{
                          marginTop: 12,
                          fontSize: 13,
                          lineHeight: 19,
                          color: colors.mutedForeground,
                        }}
                      >
                        {t('whatsapp.step2')}
                      </AppText>
                    </Card>
                  </AnimatedIn>
                ) : null}
              </>
            ) : (
              <AnimatedIn index={2}>
                <Card padding={16}>
                  <AppText style={{ fontFamily: Font.semibold, marginBottom: 8 }}>
                    {t('whatsapp.howToUse')}
                  </AppText>
                  <AppText style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 21 }}>
                    {t('whatsapp.howToUseBody')}
                  </AppText>
                </Card>
              </AnimatedIn>
            )}

            {Platform.OS === 'web' ? null : <View style={{ height: 24 }} />}
          </>
        )}
      </ScreenContainer>
    </View>
  );
}
