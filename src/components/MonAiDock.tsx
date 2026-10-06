import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { AppText, Font } from '@/src/components/ui/AppText';
import { PressableScale } from '@/src/components/ui/Glass';

interface MonAiDockProps {
  onAdd: () => void;
  onVoice: () => void;
  onPhoto: () => void;
  onSearch?: () => void;
}

/** MonAi-style bottom dock: soft pill + primary mic (MONI green) */
export function MonAiDock({ onAdd, onVoice, onPhoto, onSearch }: MonAiDockProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const bottom = Math.max(insets.bottom, 10) + 58;

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 300, justifyContent: 'flex-end' }]}
    >
      {menuOpen ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
      ) : null}

      <View
        style={{
          paddingHorizontal: 22,
          paddingBottom: bottom,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ alignItems: 'flex-start' }}>
          {menuOpen ? (
            <Animated.View entering={FadeInUp.duration(160)} exiting={FadeOutDown.duration(100)} style={{ marginBottom: 12, gap: 8 }}>
              {[
                { key: 'manual', icon: 'create-outline' as const, label: t('fab.manual'), fn: onAdd },
                { key: 'photo', icon: 'receipt-outline' as const, label: t('fab.photo'), fn: onPhoto },
              ].map((a) => (
                <PressableScale
                  key={a.key}
                  onPress={() => {
                    setMenuOpen(false);
                    a.fn();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: colors.card,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 18,
                    shadowColor: '#000',
                    shadowOpacity: isDark ? 0.35 : 0.1,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 6,
                  }}
                >
                  <Ionicons name={a.icon} size={18} color={colors.foreground} />
                  <AppText style={{ fontFamily: Font.semibold, fontSize: 15 }}>{a.label}</AppText>
                </PressableScale>
              ))}
            </Animated.View>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: 28,
              paddingHorizontal: 6,
              paddingVertical: 6,
              gap: 2,
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.35 : 0.12,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                setMenuOpen((v) => !v);
              }}
              accessibilityLabel={t('fab.add')}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={menuOpen ? 'close' : 'add'} size={26} color={colors.foreground} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                onSearch?.();
              }}
              accessibilityLabel={t('common.seeAll')}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="search-outline" size={22} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <PressableScale
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
            onVoice();
          }}
          scaleTo={0.94}
          accessibilityLabel={t('fab.voice')}
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOpacity: 0.45,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 10,
          }}
        >
          <Ionicons name="mic" size={30} color={colors.primaryForeground} />
        </PressableScale>
      </View>
    </View>
  );
}
