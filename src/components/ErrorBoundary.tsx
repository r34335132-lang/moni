import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

/** No LanguageProvider dependency — ErrorBoundary may wrap above it. */
function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
        Algo salió mal
      </Text>
      <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginBottom: 24 }}>
        {error?.message ?? 'Error inesperado'}
      </Text>
      <Pressable onPress={onRetry} style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius }}>
        <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Reintentar</Text>
      </Pressable>
    </View>
  );
}
