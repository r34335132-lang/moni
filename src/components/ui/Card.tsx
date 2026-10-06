import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { PressableScale } from '@/src/components/ui/Glass';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Font } from '@/src/components/ui/AppText';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
  elevated?: boolean;
}

export function Card({ children, padding = 16, elevated = true, style, ...props }: CardProps) {
  const { colors, radius, isDark } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius,
          padding,
          ...(elevated
            ? {
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.28 : 0.06,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
              }
            : {
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
              }),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export function StatCard({ label, value, subtitle, color }: StatCardProps) {
  const { colors, radius, isDark } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius,
        paddingVertical: 16,
        paddingHorizontal: 14,
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.28 : 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        minWidth: 140,
        flex: 1,
      }}
    >
      <AppText variant="caption" style={{ color: colors.mutedForeground, fontFamily: Font.medium, marginBottom: 8 }}>
        {label}
      </AppText>
      <AppText
        style={{
          color: color ?? colors.foreground,
          fontFamily: Font.bold,
          fontSize: 20,
          letterSpacing: -0.4,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" style={{ color: colors.mutedForeground, marginTop: 4 }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <AppText
      style={{
        color: colors.mutedForeground,
        fontSize: 13,
        fontFamily: Font.semibold,
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      {children}
    </AppText>
  );
}

export function SettingsGroup({ children, footer }: { children: React.ReactNode; footer?: string }) {
  const { colors, radius, isDark } = useTheme();
  return (
    <View style={{ marginBottom: 22 }}>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radius,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.28 : 0.06,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        {children}
      </View>
      {footer ? (
        <AppText variant="caption" style={{ color: colors.mutedForeground, marginTop: 8, marginHorizontal: 16 }}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

export function SettingsRow({
  icon,
  label,
  value,
  subtitle,
  onPress,
  destructive,
  isLast,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.99}
      haptic={!!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: subtitle ? 14 : 15,
        paddingHorizontal: 16,
        minHeight: 60,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: destructive ? 'rgba(229,72,77,0.12)' : colors.fill,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}
        >
          <Ionicons name={icon} size={20} color={destructive ? colors.destructive : colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
        <AppText
          style={{
            color: destructive ? colors.destructive : colors.foreground,
            fontSize: 17,
            fontFamily: Font.semibold,
          }}
          numberOfLines={1}
        >
          {label}
        </AppText>
        {subtitle ? (
          <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="callout" style={{ color: colors.mutedForeground, marginRight: 6 }} numberOfLines={1}>
          {value}
        </AppText>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} /> : null}
    </PressableScale>
  );
}
