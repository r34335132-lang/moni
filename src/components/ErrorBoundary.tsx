import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';

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

function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{t('common.somethingWrong')}</Text>
      <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginBottom: 24 }}>{error?.message ?? t('common.unexpectedError')}</Text>
      <Pressable onPress={onRetry} style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius }}>
        <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}
