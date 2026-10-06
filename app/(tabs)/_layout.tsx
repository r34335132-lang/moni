import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/providers/AuthProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { BlurView } from 'expo-blur';

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  focused: boolean;
}) {
  const { colors } = useTheme();
  const filled = name.replace('-outline', '') as keyof typeof Ionicons.glyphMap;
  return (
    <View
      style={{
        width: 44,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.accent : 'transparent',
      }}
    >
      <Ionicons name={focused ? filled : name} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { session, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarBackground:
          Platform.OS === 'ios'
            ? () => <BlurView intensity={72} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            : undefined,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.card,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          height: 56 + insets.bottom,
          paddingBottom: Math.max(insets.bottom - 2, 10),
          paddingTop: 8,
          ...(Platform.OS === 'ios' ? { position: 'absolute' as const } : null),
          elevation: 0,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans_500Medium',
          fontSize: 11,
          fontWeight: '500',
          letterSpacing: -0.05,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="home-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen name="transactions" options={{ href: null }} />
      <Tabs.Screen
        name="reminders"
        options={{
          title: t('tabs.reminders'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="notifications-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: t('tabs.loans'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="cash-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: t('tabs.budgets'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="pie-chart-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="person-outline" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
