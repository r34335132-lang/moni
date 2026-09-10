import React, { useState } from 'react';
import { View, Text, Alert, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useBeneficiaries,
  useCreateBeneficiary,
  useDeleteBeneficiary,
} from '@/src/hooks/useBeneficiaries';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { FormModal } from '@/src/components/ui/FormModal';
import { getErrorMessage } from '@/src/core/utils/errors';

const RELATIONSHIP_KEYS = ['child', 'family', 'partner', 'friend', 'other'] as const;
const RELATIONSHIP_STORAGE: Record<(typeof RELATIONSHIP_KEYS)[number], string> = {
  child: 'Hijo/a',
  family: 'Familiar',
  partner: 'Pareja',
  friend: 'Amigo/a',
  other: 'Otro',
};

export default function BeneficiariesScreen() {
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const { data: beneficiaries, isLoading } = useBeneficiaries();
  const createBeneficiary = useCreateBeneficiary();
  const deleteBeneficiary = useDeleteBeneficiary();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [relationshipKey, setRelationshipKey] = useState<(typeof RELATIONSHIP_KEYS)[number]>('family');
  const [notes, setNotes] = useState('');

  const relationshipLabel = (stored: string) => {
    const entry = Object.entries(RELATIONSHIP_STORAGE).find(([, v]) => v === stored);
    if (!entry) return stored;
    return t(`beneficiaries.${entry[0]}`);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createBeneficiary.mutateAsync({
        name: name.trim(),
        relationship: RELATIONSHIP_STORAGE[relationshipKey],
        notes: notes.trim() || undefined,
      });
      setName('');
      setNotes('');
      setShowForm(false);
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  const handleDelete = (id: string, beneficiaryName: string) => {
    Alert.alert(t('beneficiaries.delete'), t('beneficiaries.deleteConfirm', { name: beneficiaryName }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteBeneficiary.mutate(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('beneficiaries.title')} showBack subtitle={t('beneficiaries.subtitle')} />
      <ScreenContainer>
        <PrimarySaveButton title={t('beneficiaries.add')} icon="person-add" onPress={() => setShowForm(true)} style={{ marginBottom: 16 }} />

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : beneficiaries?.length ? (
          beneficiaries.map((b) => (
            <Pressable key={b.id} onPress={() => router.push(`/beneficiaries/${b.id}`)}>
              <Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: `${colors.primary}22`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="person" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>{b.name}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{relationshipLabel(b.relationship)}</Text>
                </View>
                <Pressable onPress={() => handleDelete(b.id, b.name)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                </Pressable>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState title={t('beneficiaries.empty')} subtitle={t('beneficiaries.emptySub')} actionLabel={t('beneficiaries.add')} onAction={() => setShowForm(true)} />
        )}

        <FormModal
          visible={showForm}
          onClose={() => setShowForm(false)}
          title={t('beneficiaries.new')}
          footer={
            <>
              <PrimarySaveButton title={t('common.save')} onPress={handleCreate} loading={createBeneficiary.isPending} />
              <Button title={t('common.cancel')} variant="ghost" onPress={() => setShowForm(false)} />
            </>
          }
        >
          <Input label={t('common.name')} value={name} onChangeText={setName} placeholder={t('beneficiaries.namePlaceholder')} />
          <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 8 }}>{t('beneficiaries.relationship')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {RELATIONSHIP_KEYS.map((key) => (
              <Pressable
                key={key}
                onPress={() => setRelationshipKey(key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radius,
                  backgroundColor: relationshipKey === key ? colors.primary : colors.secondary,
                  borderWidth: 1,
                  borderColor: relationshipKey === key ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: relationshipKey === key ? colors.primaryForeground : colors.foreground, fontWeight: '600' }}>
                  {t(`beneficiaries.${key}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Input label={t('common.noteOptional')} value={notes} onChangeText={setNotes} placeholder={t('beneficiaries.notePlaceholder')} multiline />
        </FormModal>
      </ScreenContainer>
    </View>
  );
}
