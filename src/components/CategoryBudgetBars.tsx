import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { AppText, Font } from '@/src/components/ui/AppText';
import { getCategoryIcon } from '@/src/core/constants/categories';
import { formatPercent } from '@/src/core/utils/format';
import type { ExpenseSlice } from '@/src/components/ExpenseDonutChart';

const BAR_MAX_H = 140;
const PASTELS = ['#F5EDE3', '#F8E4EA', '#FDE8D8', '#E8EEF5', '#E7F3EA', '#F3E8F8', '#E8F4F3'];

function softBg(hex: string, index: number): string {
  if (!hex || hex.length < 7) return PASTELS[index % PASTELS.length];
  return PASTELS[index % PASTELS.length];
}

function compactAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return `${Math.round(n)}`;
}

export interface CategoryBarItem {
  name: string;
  amount: number;
  color: string;
  icon?: string | null;
  budget?: number | null;
}

interface CategoryBudgetBarsProps {
  items: CategoryBarItem[];
  onPressEdit?: () => void;
  emptyLabel?: string;
}

function BarColumn({
  item,
  index,
  maxAmount,
}: {
  item: CategoryBarItem;
  index: number;
  maxAmount: number;
}) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const limit = item.budget && item.budget > 0 ? item.budget : maxAmount;
  const fillRatio = Math.min(1, item.amount / Math.max(limit, 1));
  const capRatio = item.budget && item.budget > 0 ? Math.min(1, item.budget / Math.max(maxAmount, item.budget, 1)) : 1;
  const fillH = Math.max(28, fillRatio * BAR_MAX_H);
  const capH = Math.max(fillH, capRatio * BAR_MAX_H);
  const pct = item.budget && item.budget > 0 ? (item.amount / item.budget) * 100 : (item.amount / maxAmount) * 100;
  const over = item.budget != null && item.budget > 0 && item.amount > item.budget;

  useEffect(() => {
    progress.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [progress, item.amount]);

  const anim = useAnimatedStyle(() => ({
    height: fillH * progress.value,
    opacity: 0.35 + progress.value * 0.65,
  }));

  return (
    <View style={{ alignItems: 'center', width: 64, marginHorizontal: 4 }}>
      <AppText
        style={{
          color: over ? colors.destructive : colors.foreground,
          fontFamily: Font.bold,
          fontSize: 12,
          marginBottom: 6,
        }}
        numberOfLines={1}
      >
        {compactAmount(item.amount)}
      </AppText>
      <View style={{ height: BAR_MAX_H, width: 52, justifyContent: 'flex-end', alignItems: 'center' }}>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: 52,
            height: capH,
            borderRadius: 26,
            borderWidth: 1.5,
            borderColor: colors.border,
            borderStyle: 'dashed',
            backgroundColor: softBg(item.color, index),
          }}
        />
        <Animated.View
          style={[
            {
              width: 52,
              borderRadius: 26,
              backgroundColor: item.color || colors.primary,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: 10,
            },
            anim,
          ]}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={getCategoryIcon(item.icon)} size={15} color={item.color || colors.foreground} />
          </View>
        </Animated.View>
      </View>
      <AppText
        style={{
          color: colors.mutedForeground,
          fontSize: 11,
          fontFamily: Font.semibold,
          marginTop: 8,
        }}
        numberOfLines={1}
      >
        {formatPercent(Math.min(pct, 999))}
      </AppText>
      <AppText
        style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2, textAlign: 'center' }}
        numberOfLines={1}
      >
        {item.name}
      </AppText>
    </View>
  );
}

export function CategoryBudgetBars({ items, onPressEdit, emptyLabel }: CategoryBudgetBarsProps) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const top = items.slice(0, 5);
  const maxAmount = Math.max(...top.map((i) => Math.max(i.amount, i.budget ?? 0)), 1);

  if (!top.length) {
    return (
      <Pressable
        onPress={onPressEdit}
        style={{
          backgroundColor: colors.card,
          borderRadius: radius,
          padding: 28,
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <AppText style={{ color: colors.mutedForeground, textAlign: 'center' }}>
          {emptyLabel ?? t('dashboard.noCategorySpend')}
        </AppText>
      </Pressable>
    );
  }

  return (
    <View style={{ marginBottom: 8 }}>
      {onPressEdit ? (
        <Pressable onPress={onPressEdit} style={{ alignSelf: 'center', marginBottom: 12 }}>
          <AppText style={{ color: colors.mutedForeground, fontFamily: Font.medium, fontSize: 14 }}>
            {t('dashboard.editBudget')} ▾
          </AppText>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 4 }}>
        {top.map((item, index) => (
          <BarColumn key={`${item.name}-${index}`} item={item} index={index} maxAmount={maxAmount} />
        ))}
      </View>
    </View>
  );
}

export function slicesToBarItems(
  slices: ExpenseSlice[],
  budgets?: Array<{ category_id: string; amount: number; category?: { name?: string } | null; spent?: number }>,
): CategoryBarItem[] {
  return slices.map((s) => {
    const budget = budgets?.find((b) => b.category?.name === s.name);
    return {
      name: s.name,
      amount: s.amount,
      color: s.color,
      icon: s.icon,
      budget: budget ? Number(budget.amount) : null,
    };
  });
}
