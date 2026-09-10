import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';

interface FabMenuProps {
  onManual: () => void;
  onVoice: () => void;
  onPhoto: () => void;
}

export function FabMenu({ onManual, onVoice, onPhoto }: FabMenuProps) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = React.useState(false);

  const actions = [
    { icon: 'create-outline' as const, label: t('fab.manual'), onPress: onManual },
    { icon: 'mic-outline' as const, label: t('fab.voice'), onPress: onVoice },
    { icon: 'camera-outline' as const, label: t('fab.photo'), onPress: onPhoto },
  ];

  const bottomOffset = 72 + insets.bottom;

  return (
    <View style={{ position: 'absolute', bottom: bottomOffset, right: 16, alignItems: 'flex-end', zIndex: 100 }}>
      {open &&
        actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => { setOpen(false); a.onPress(); }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: radius,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>{a.label}</Text>
            <Ionicons name={a.icon} size={22} color={colors.primary} />
          </Pressable>
        ))}

      <Pressable
        onPress={() => setOpen(!open)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingLeft: open ? 18 : 22,
          paddingRight: 22,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#22C55E',
          borderWidth: 2,
          borderColor: '#16A34A',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <Ionicons name={open ? 'close' : 'add'} size={28} color="#FFFFFF" />
        {!open && (
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>{t('fab.add')}</Text>
        )}
      </Pressable>
    </View>
  );
}
