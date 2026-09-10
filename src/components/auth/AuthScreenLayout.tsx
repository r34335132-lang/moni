import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTheme } from '@/src/hooks/useTheme';

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

  const gradientColors = isDark
    ? (['#0A0A0A', '#0F2B1A', '#0A0A0A'] as const)
    : (['#F0FBF4', '#FFFFFF', '#FAFAFA'] as const);

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={footer ? 100 : 40}
        extraKeyboardSpace={24}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 16,
          paddingBottom: footer ? 16 : insets.bottom + 24,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
          {showBack && (
            <Pressable onPress={() => router.back()} style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
              <Ionicons name="arrow-back" size={26} color={colors.foreground} />
            </Pressable>
          )}

          <View style={{ alignItems: 'center', marginBottom: 36, marginTop: showBack ? 0 : 24 }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 28,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text style={{ color: colors.primaryForeground, fontSize: 36, fontWeight: '800' }}>M</Text>
            </View>
            <Text style={{ fontSize: 34, fontWeight: '800', color: colors.foreground, letterSpacing: 2 }}>
              MONI
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.mutedForeground,
                marginTop: 8,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              {subtitle}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground, marginBottom: 20 }}>
              {title}
            </Text>
            {children}
        </View>
      </KeyboardAwareScrollView>

      {footer ? (
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              backgroundColor: isDark ? 'rgba(10,10,10,0.95)' : 'rgba(255,255,255,0.95)',
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            {footer}
          </View>
        ) : null}
    </LinearGradient>
  );
}
