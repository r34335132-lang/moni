import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { AppText, Font } from '@/src/components/ui/AppText';
import { PressableScale } from '@/src/components/ui/Glass';
import { Card } from '@/src/components/ui/Card';

/** Soft hero header for create/add screens */
export function FormHero({
  icon,
  title,
  subtitle,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  tint?: string;
}) {
  const { colors, isDark } = useTheme();
  const accent = tint ?? colors.primary;

  return (
    <View
      style={{
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: colors.card,
        borderRadius: 28,
        paddingVertical: 22,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.28 : 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: `${accent}22`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Ionicons name={icon} size={28} color={accent} />
      </View>
      <AppText style={{ fontFamily: Font.bold, fontSize: 22, letterSpacing: -0.4, textAlign: 'center' }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText
          style={{
            color: colors.mutedForeground,
            fontSize: 14,
            lineHeight: 20,
            textAlign: 'center',
            marginTop: 6,
            paddingHorizontal: 8,
          }}
        >
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

export function FormSection({
  label,
  children,
  card = true,
}: {
  label?: string;
  children: React.ReactNode;
  card?: boolean;
}) {
  const { colors } = useTheme();
  const body = (
    <>
      {label ? (
        <AppText style={{ color: colors.mutedForeground, fontFamily: Font.semibold, fontSize: 13, marginBottom: 12 }}>
          {label}
        </AppText>
      ) : null}
      {children}
    </>
  );

  if (!card) {
    return <View style={{ marginBottom: 16 }}>{body}</View>;
  }

  return (
    <Card style={{ marginBottom: 16 }} padding={16}>
      {body}
    </Card>
  );
}

export function FormChip({
  label,
  selected,
  onPress,
  color,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors, radiusPill } = useTheme();
  const accent = color ?? colors.primary;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: radiusPill,
        backgroundColor: selected ? `${accent}22` : colors.fill,
        borderWidth: selected ? 1.5 : 0,
        borderColor: accent,
      }}
    >
      {icon ? <Ionicons name={icon} size={16} color={selected ? accent : colors.mutedForeground} /> : null}
      <AppText
        style={{
          color: selected ? colors.foreground : colors.mutedForeground,
          fontFamily: selected ? Font.semibold : Font.medium,
          fontSize: 14,
        }}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </PressableScale>
  );
}

export function FormTypeToggle({
  value,
  onChange,
  leftLabel,
  rightLabel,
  leftValue = 'expense',
  rightValue = 'income',
}: {
  value: string;
  onChange: (v: string) => void;
  leftLabel: string;
  rightLabel: string;
  leftValue?: string;
  rightValue?: string;
}) {
  const { colors, radiusPill, isDark } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: radiusPill,
        padding: 4,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.25 : 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      {[
        { id: leftValue, label: leftLabel },
        { id: rightValue, label: rightLabel },
      ].map((opt) => {
        const selected = value === opt.id;
        return (
          <PressableScale
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: radiusPill,
              alignItems: 'center',
              backgroundColor: selected ? colors.primary : 'transparent',
            }}
          >
            <AppText
              style={{
                color: selected ? colors.primaryForeground : colors.mutedForeground,
                fontFamily: Font.semibold,
                fontSize: 16,
              }}
            >
              {opt.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}
