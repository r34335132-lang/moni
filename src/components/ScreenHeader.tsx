import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font, Type } from '@/src/components/ui/AppText';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  large?: boolean;
}

export function ScreenHeader({ title, subtitle, showBack, rightAction, large = true }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const big = large && !showBack;

  return (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: big ? 12 : 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
          {showBack ? (
            <PressableScale
              onPress={() => router.back()}
              scaleTo={0.92}
              accessibilityRole="button"
              accessibilityLabel="Volver"
              style={{
                marginRight: 10,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 2,
              }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.foreground} />
            </PressableScale>
          ) : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText
              style={{
                color: colors.foreground,
                fontFamily: Font.bold,
                fontSize: big ? Type.title.fontSize : 22,
                lineHeight: big ? Type.title.lineHeight : 28,
                letterSpacing: big ? Type.title.letterSpacing : -0.3,
              }}
              numberOfLines={2}
              maxFontSizeMultiplier={1.3}
            >
              {title}
            </AppText>
            {subtitle ? (
              <AppText
                style={{
                  color: colors.mutedForeground,
                  fontFamily: Font.regular,
                  fontSize: 15,
                  lineHeight: 20,
                  marginTop: 3,
                }}
                numberOfLines={2}
              >
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </View>
        {rightAction}
      </View>
    </View>
  );
}
