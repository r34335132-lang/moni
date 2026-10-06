import React from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  type ViewProps,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { AppText, Font } from '@/src/components/ui/AppText';
import { PressableScale } from '@/src/components/ui/Glass';

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Soft bottom sheet modal — MonAi style */
export function FormModal({ visible, onClose, title, children, footer }: FormModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: '94%',
            width: '100%',
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.45 : 0.15,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -8 },
            elevation: 12,
          }}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 }}>
            <View
              style={{
                width: 40,
                height: 5,
                backgroundColor: colors.fill,
                borderRadius: 3,
                alignSelf: 'center',
                marginBottom: 14,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText style={{ fontFamily: Font.bold, fontSize: 20, letterSpacing: -0.3, flex: 1 }}>
                {title}
              </AppText>
              <PressableScale
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.fill,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color={colors.foreground} />
              </PressableScale>
            </View>
          </View>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bottomOffset={60}
            extraKeyboardSpace={80}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: Math.max(insets.bottom, 24) + 40,
            }}
          >
            {children}
            {footer ? <View style={{ marginTop: 16, gap: 10 }}>{footer}</View> : null}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
