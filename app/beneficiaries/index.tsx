import React, { useState } from 'react';
import { View, Alert, Pressable, ActivityIndicator } from 'react-native';
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
import { IconActionButton } from '@/src/components/ui/IconActionButton';
import { PressableScale } from '@/src/components/ui/Glass';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { AppText, Font } from '@/src/components/ui/AppText';
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
  const { colors, radiusPill } = useTheme();
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
        <AnimatedIn>
          <PressableScale
            onPress={() => setShowForm(true)}
            style={{
              borderRadius: radiusPill,
              backgroundColor: colors.primary,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              marginBottom: 18,
              shadowColor: colors.primary,
              shadowOpacity: 0.28,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.primaryForeground} />
            <AppText style={{ fontFamily: Font.semibold, fontSize: 16, color: colors.primaryForeground }}>
              {t('beneficiaries.add')}
            </AppText>
          </PressableScale>
        </AnimatedIn>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : beneficiaries?.length ? (
          beneficiaries.map((b, index) => (
            <AnimatedIn key={b.id} index={index}>
              <PressableScale onPress={() => router.push(`/beneficiaries/${b.id}`)} scaleTo={0.98}>
                <Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }} padding={14}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name="person" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontFamily: Font.semibold, fontSize: 16 }}>{b.name}</AppText>
                    <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
                      {relationshipLabel(b.relationship)}
                    </AppText>
                  </View>
                  <IconActionButton
                    variant="delete"
                    size="sm"
                    onPress={() => handleDelete(b.id, b.name)}
                    accessibilityLabel={t('common.delete')}
                    style={{ marginRight: 4 }}
                  />
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </Card>
              </PressableScale>
            </AnimatedIn>
          ))
        ) : (
          <EmptyState
            title={t('beneficiaries.empty')}
            subtitle={t('beneficiaries.emptySub')}
            actionLabel={t('beneficiaries.add')}
            onAction={() => setShowForm(true)}
          />
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
          <Input
            label={t('common.name')}
            value={name}
            onChangeText={setName}
            placeholder={t('beneficiaries.namePlaceholder')}
          />
          <AppText style={{ fontFamily: Font.semibold, marginBottom: 8 }}>{t('beneficiaries.relationship')}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {RELATIONSHIP_KEYS.map((key) => {
              const selected = relationshipKey === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setRelationshipKey(key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: radiusPill,
                    backgroundColor: selected ? colors.primary : colors.fill,
                  }}
                >
                  <AppText
                    style={{
                      color: selected ? colors.primaryForeground : colors.foreground,
                      fontFamily: Font.semibold,
                    }}
                  >
                    {t(`beneficiaries.${key}`)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <Input
            label={t('common.noteOptional')}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('beneficiaries.notePlaceholder')}
            multiline
          />
        </FormModal>
      </ScreenContainer>
    </View>
  );
}
