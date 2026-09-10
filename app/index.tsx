import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { useTheme } from '@/src/hooks/useTheme';

export default function Index() {
  const { session, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (session) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
