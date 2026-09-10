import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen
        name="transactions"
        options={{ href: null }}
      />
      <Tabs.Screen name="reminders" options={{ title: t('tabs.reminders'), tabBarIcon: ({ color }) => <Feather name="bell" size={22} color={color} /> }} />
      <Tabs.Screen name="loans" options={{ title: t('tabs.loans'), tabBarIcon: ({ color }) => <Feather name="dollar-sign" size={22} color={color} /> }} />
      <Tabs.Screen name="budgets" options={{ title: t('tabs.budgets'), tabBarIcon: ({ color }) => <Feather name="pie-chart" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}
