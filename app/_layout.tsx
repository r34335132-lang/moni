import '../global.css';
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { LanguageProvider } from '@/src/providers/LanguageProvider';
import { NotificationProvider } from '@/src/providers/NotificationProvider';
import { validateEnv } from '@/src/core/config/env';

SplashScreen.preventAutoHideAsync();
validateEnv();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

export default function RootLayout() {
  const scheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AuthProvider>
                  <NotificationProvider>
                  <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="transaction/add-manual" options={{ presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="transaction/add-voice" options={{ presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="transaction/add-photo" options={{ presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="loans/create-borrowed" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="loans/create-lent" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="loans/[id]" />
                    <Stack.Screen name="budgets/create" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="savings-goals/create" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="savings-goals/index" />
                    <Stack.Screen name="accounts/index" />
                    <Stack.Screen name="accounts/[id]" />
                    <Stack.Screen name="categories/index" />
                    <Stack.Screen name="reports/index" />
                    <Stack.Screen name="beneficiaries/index" />
                    <Stack.Screen name="beneficiaries/[id]" />
                    <Stack.Screen name="minigame/index" />
                    <Stack.Screen name="bank/index" />
                    <Stack.Screen name="subscription/index" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="reminders/index" />
                  </Stack>
                  </NotificationProvider>
                </AuthProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </LanguageProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
