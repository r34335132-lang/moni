import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewProps,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Modal con scroll — el teclado no tapa los campos */
export function FormModal({ visible, onClose, title, children, footer }: FormModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '94%',
            width: '100%',
          }}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 }} />
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>{title}</Text>
          </View>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bottomOffset={60}
            extraKeyboardSpace={80}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: Math.max(insets.bottom, 24) + 40,
            }}
          >
            {children}
            {footer ? <View style={{ marginTop: 16, gap: 8 }}>{footer}</View> : null}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
});

interface KeyboardFormScreenProps extends ViewProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentContainerStyle?: object;
}

export function KeyboardFormScreen({ children, footer, contentContainerStyle, style, ...rest }: KeyboardFormScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[{ flex: 1 }, style]} {...rest}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={90}
        extraKeyboardSpace={80}
        contentContainerStyle={[{ paddingBottom: Math.max(insets.bottom, 24) + 80 }, contentContainerStyle]}
      >
        {children}
      </KeyboardAwareScrollView>
      {footer}
    </View>
  );
}
