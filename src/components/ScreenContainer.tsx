import React from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScrollViewProps } from 'react-native';

interface ScreenContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  padded?: boolean;
}

export function ScreenContainer({
  children,
  padded = true,
  contentContainerStyle,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bottomOffset={48}
      extraKeyboardSpace={24}
      contentContainerStyle={[
        {
          paddingTop: padded ? 16 : 0,
          paddingHorizontal: padded ? 16 : 0,
          paddingBottom: bottomPad + 80,
          flexGrow: 1,
        },
        contentContainerStyle,
      ]}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
