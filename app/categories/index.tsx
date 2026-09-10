import React, { useMemo, useState } from 'react';
import { View, Text, Alert, Pressable, ActivityIndicator, ScrollView } from 'react-native';
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
import { getErrorMessage } from '@/src/core/utils/errors';
import type { Category, CategoryType } from '@/src/core/types/entities';

function CategoryCard({ cat, onDelete }: { cat: Category; onDelete?: () => void }) {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const typeLabel = cat.type === 'income' ? t('common.income') : cat.type === 'both' ? t('common.both') : t('common.expense');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 10,
        backgroundColor: colors.card,
        borderRadius: radius,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: `${cat.color}22`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <Ionicons name={getCategoryIcon(cat.icon)} size={22} color={cat.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>{cat.name}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
          {typeLabel}{cat.is_system ? ` · ${t('categories.system')}` : ''}
        </Text>
      </View>
      {cat.is_system ? (
        <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} />
      ) : onDelete ? (
        <Pressable onPress={onDelete} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function CategoriesScreen() {
  const { colors, radius } = useTheme();
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
          <Pressable onPress={() => setShowForm(!showForm)}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('categories.new')}</Text>
          </Pressable>
        }
      />
      <ScreenContainer>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 16, lineHeight: 20 }}>
          {t('categories.basicsHint', { list: SYSTEM_CATEGORY_NAMES.slice(0, 8).join(', ') })}
        </Text>

        {showForm && (
          <View style={{ marginBottom: 16 }}>
            <Input label={t('common.name')} value={name} onChangeText={setName} placeholder={t('categories.namePlaceholder')} />

            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>{t('common.type')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {(['expense', 'income'] as const).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setCatType(opt)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: radius,
                    alignItems: 'center',
                    backgroundColor: catType === opt ? colors.primary : colors.secondary,
                    borderWidth: 1,
                    borderColor: catType === opt ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: catType === opt ? colors.primaryForeground : colors.foreground, fontWeight: '700' }}>
                    {opt === 'expense' ? t('common.expense') : t('common.income')}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>{t('categories.icon')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {PICKABLE_CATEGORY_ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    marginRight: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: icon === ic ? `${color}44` : colors.secondary,
                    borderWidth: 2,
                    borderColor: icon === ic ? color : colors.border,
                  }}
                >
                  <Ionicons name={getCategoryIcon(ic)} size={22} color={icon === ic ? color : colors.foreground} />
                </Pressable>
              ))}
            </ScrollView>

            <PrimarySaveButton title={t('categories.create')} icon="add-circle" onPress={handleCreate} loading={createCategory.isPending} />
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : categories?.length ? (
          <>
            {expenses.length > 0 && (
              <>
                <Text style={{ color: '#DC2626', fontSize: 15, fontWeight: '700', marginBottom: 10 }}>{t('transactions.expenses')}</Text>
                {expenses.map((cat) => (
                  <CategoryCard key={`exp-${cat.id}`} cat={cat} onDelete={cat.is_system ? undefined : () => confirmDelete(cat)} />
                ))}
              </>
            )}
            {incomes.length > 0 && (
              <>
                <Text style={{ color: '#15803D', fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: expenses.length ? 16 : 0 }}>
                  {t('transactions.incomes')}
                </Text>
                {incomes.map((cat) => (
                  <CategoryCard key={`inc-${cat.id}`} cat={cat} onDelete={cat.is_system ? undefined : () => confirmDelete(cat)} />
                ))}
              </>
            )}
          </>
        ) : (
          <EmptyState title={t('categories.empty')} />
        )}
      </ScreenContainer>
    </View>
  );
}
