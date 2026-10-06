import React, { useMemo, useState } from 'react';
import { View, Alert, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/src/hooks/useCategories';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import {
  getCategoryIcon,
  PICKABLE_CATEGORY_ICONS,
  DEFAULT_CATEGORY_COLORS,
  SYSTEM_CATEGORY_NAMES,
} from '@/src/core/constants/categories';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Input } from '@/src/components/ui/Input';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { EmptyState } from '@/src/components/EmptyState';
import { IconActionButton } from '@/src/components/ui/IconActionButton';
import { Card, SectionLabel } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/Glass';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { AppText, Font } from '@/src/components/ui/AppText';
import { getErrorMessage } from '@/src/core/utils/errors';
import type { Category, CategoryType } from '@/src/core/types/entities';

function CategoryCard({ cat, onDelete, index = 0 }: { cat: Category; onDelete?: () => void; index?: number }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const typeLabel =
    cat.type === 'income' ? t('common.income') : cat.type === 'both' ? t('common.both') : t('common.expense');

  return (
    <AnimatedIn index={index}>
      <Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }} padding={14}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 18,
            backgroundColor: `${cat.color}22`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}
        >
          <Ionicons name={getCategoryIcon(cat.icon)} size={22} color={cat.color} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontSize: 16, fontFamily: Font.semibold }}>{cat.name}</AppText>
          <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
            {typeLabel}
            {cat.is_system ? ` · ${t('categories.system')}` : ''}
          </AppText>
        </View>
        {cat.is_system ? (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.fill,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="lock-closed" size={16} color={colors.mutedForeground} />
          </View>
        ) : onDelete ? (
          <IconActionButton variant="delete" size="sm" onPress={onDelete} accessibilityLabel={t('common.delete')} />
        ) : null}
      </Card>
    </AnimatedIn>
  );
}

export default function CategoriesScreen() {
  const { colors, radiusPill } = useTheme();
  const { t } = useLanguage();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [icon, setIcon] = useState<string>('ellipsis-horizontal');
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLORS[0]);

  const { expenses, incomes } = useMemo(() => {
    const expenses: Category[] = [];
    const incomes: Category[] = [];
    categories?.forEach((cat) => {
      if (cat.type === 'income') incomes.push(cat);
      else if (cat.type === 'expense') expenses.push(cat);
      else {
        expenses.push(cat);
        incomes.push(cat);
      }
    });
    return { expenses, incomes };
  }, [categories]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createCategory.mutateAsync({
        name: name.trim(),
        type: catType as CategoryType,
        icon,
        color,
      });
      setName('');
      setShowForm(false);
      setCatType('expense');
      setIcon('ellipsis-horizontal');
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  const confirmDelete = (cat: Category) => {
    Alert.alert(t('categories.delete'), t('categories.deleteConfirm', { name: cat.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          deleteCategory.mutate(cat.id, {
            onError: (e) => Alert.alert(t('common.error'), getErrorMessage(e)),
          }),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('categories.title')}
        showBack
        rightAction={
          <PressableScale
            onPress={() => setShowForm(!showForm)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: radiusPill,
              backgroundColor: colors.fill,
            }}
          >
            <AppText style={{ color: colors.primary, fontFamily: Font.semibold }}>{t('categories.new')}</AppText>
          </PressableScale>
        }
      />
      <ScreenContainer>
        <AppText style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
          {t('categories.basicsHint', { list: SYSTEM_CATEGORY_NAMES.slice(0, 8).join(', ') })}
        </AppText>

        {showForm ? (
          <Card style={{ marginBottom: 18 }} padding={16}>
            <Input label={t('common.name')} value={name} onChangeText={setName} placeholder={t('categories.namePlaceholder')} />

            <AppText style={{ fontFamily: Font.semibold, fontSize: 14, marginBottom: 8 }}>{t('common.type')}</AppText>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {(['expense', 'income'] as const).map((opt) => {
                const selected = catType === opt;
                return (
                  <PressableScale
                    key={opt}
                    onPress={() => setCatType(opt)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: radiusPill,
                      alignItems: 'center',
                      backgroundColor: selected ? colors.primary : colors.fill,
                    }}
                  >
                    <AppText
                      style={{
                        color: selected ? colors.primaryForeground : colors.foreground,
                        fontFamily: Font.bold,
                      }}
                    >
                      {opt === 'expense' ? t('common.expense') : t('common.income')}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>

            <AppText style={{ fontFamily: Font.semibold, fontSize: 14, marginBottom: 8 }}>{t('categories.icon')}</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {PICKABLE_CATEGORY_ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    marginRight: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: icon === ic ? `${color}44` : colors.fill,
                    borderWidth: icon === ic ? 2 : 0,
                    borderColor: color,
                  }}
                >
                  <Ionicons name={getCategoryIcon(ic)} size={22} color={icon === ic ? color : colors.foreground} />
                </Pressable>
              ))}
            </ScrollView>

            <PrimarySaveButton
              title={t('categories.create')}
              icon="add-circle"
              onPress={handleCreate}
              loading={createCategory.isPending}
            />
          </Card>
        ) : null}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : categories?.length ? (
          <>
            {expenses.length > 0 ? (
              <>
                <SectionLabel>{t('transactions.expenses')}</SectionLabel>
                {expenses.map((cat, i) => (
                  <CategoryCard
                    key={`exp-${cat.id}`}
                    cat={cat}
                    index={i}
                    onDelete={cat.is_system ? undefined : () => confirmDelete(cat)}
                  />
                ))}
              </>
            ) : null}
            {incomes.length > 0 ? (
              <>
                <SectionLabel>{t('transactions.incomes')}</SectionLabel>
                {incomes.map((cat, i) => (
                  <CategoryCard
                    key={`inc-${cat.id}`}
                    cat={cat}
                    index={i + expenses.length}
                    onDelete={cat.is_system ? undefined : () => confirmDelete(cat)}
                  />
                ))}
              </>
            ) : null}
          </>
        ) : (
          <EmptyState title={t('categories.empty')} />
        )}
      </ScreenContainer>
    </View>
  );
}
