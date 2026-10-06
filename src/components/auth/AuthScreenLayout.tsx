import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { AppText, Font } from '@/src/components/ui/AppText';
import { PressableScale, GlassSurface } from '@/src/components/ui/Glass';

interface AuthScreenLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showBack?: boolean;
}

export function AuthScreenLayout({ title, subtitle, children, footer, showBack }: AuthScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const gradientColors = isDark
    ? (['#050806', '#0E2A18', '#07140C', '#050806'] as const)
    : (['#D8F5E4', '#F3FBF6', '#EEF8F1', '#F7FAF8'] as const);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

      {/* Soft liquid blobs */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: isDark ? 'rgba(45,190,90,0.18)' : 'rgba(45,190,90,0.22)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 120,
          left: -90,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: isDark ? 'rgba(61,219,108,0.10)' : 'rgba(61,219,108,0.16)',
        }}
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={footer ? 110 : 40}
        extraKeyboardSpace={24}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 12,
          paddingBottom: footer ? 20 : insets.bottom + 28,
          paddingHorizontal: 22,
        }}
        showsVerticalScrollIndicator={false}
      >
        {showBack ? (
          <PressableScale
            onPress={() => router.back()}
            scaleTo={0.94}
            style={{
              marginBottom: 14,
              width: 42,
              height: 42,
              borderRadius: 21,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </PressableScale>
        ) : (
          <View style={{ height: 12 }} />
        )}

        <View style={{ alignItems: 'center', marginBottom: 28, marginTop: showBack ? 4 : 12 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              overflow: 'hidden',
              marginBottom: 18,
              backgroundColor: '#0A0A0B',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.7)',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.35,
              shadowRadius: 22,
              elevation: 10,
            }}
          >
            <Image
              source={require('../../../assets/images/icon.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <AppText
            style={{
              fontSize: 30,
              fontFamily: Font.bold,
              color: colors.foreground,
              letterSpacing: -0.6,
              textAlign: 'center',
            }}
          >
            {t('brand.name')}
          </AppText>
          <AppText
            style={{
              fontSize: 12,
              fontFamily: Font.semibold,
              color: colors.primary,
              marginTop: 6,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
            }}
          >
            {t('brand.tagline')}
          </AppText>
          <AppText
            style={{
              fontSize: 15,
              fontFamily: Font.regular,
              color: colors.mutedForeground,
              marginTop: 12,
              textAlign: 'center',
              lineHeight: 21,
              paddingHorizontal: 12,
            }}
          >
            {subtitle}
          </AppText>
        </View>

        <GlassSurface intensity={isDark ? 36 : 48} borderRadius={28} padding={22} style={{ marginBottom: 8 }}>
          <AppText
            style={{
              fontSize: 22,
              fontFamily: Font.bold,
              color: colors.foreground,
              marginBottom: 18,
              letterSpacing: -0.3,
            }}
          >
            {title}
          </AppText>
          {children}
        </GlassSurface>
      </KeyboardAwareScrollView>

      {footer ? (
        <View
          style={{
            paddingHorizontal: 22,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 14) + 6,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,17,19,0.06)',
            overflow: 'hidden',
          }}
        >
          <BlurView
            intensity={isDark ? 40 : 55}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ position: 'relative' }}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}
