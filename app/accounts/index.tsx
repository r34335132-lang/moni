import React, { useCallback, useState } from 'react';
import { View, Text, Alert, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/src/hooks/useAccounts';
import { useCreateTransaction } from '@/src/hooks/useTransactions';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import type { Account } from '@/src/core/types/entities';
import type { AccountInput } from '@/src/core/validation/schemas';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { FormModal } from '@/src/components/ui/FormModal';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { AmountCalculator } from '@/src/components/ui/AmountCalculator';
import { EmptyState } from '@/src/components/EmptyState';
import { formatCurrency } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';

const ACCOUNT_TYPES: AccountInput['type'][] = ['cash', 'bank', 'credit', 'savings', 'investment'];

export default function AccountsScreen() {
  const { profile } = useAuth();
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const { data: accounts, isLoading, refetch } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createTx = useCreateTransaction();

  const typeLabels: Record<string, string> = {
    cash: t('accounts.cash'),
    bank: t('accounts.bank'),
    credit: t('accounts.credit'),
    savings: t('accounts.savings'),
    investment: t('accounts.investment'),
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountInput['type']>('bank');

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferNote, setTransferNote] = useState('');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setType('bank');
    setShowForm(true);
  };

  const openTransfer = () => {
    if ((accounts?.length ?? 0) < 2) {
      Alert.alert(t('accounts.needTwoAccounts'), t('accounts.needTwoAccountsSub'));
      return;
    }
    const defaultAcc = accounts!.find((a) => a.is_default) ?? accounts![0];
    const other = accounts!.find((a) => a.id !== defaultAcc.id) ?? accounts![1];
    setFromId(defaultAcc.id);
    setToId(other.id);
    setTransferAmount(0);
    setTransferNote('');
    setShowTransfer(true);
  };

  const openEdit = (acc: Account) => {
    setEditing(acc);
    setName(acc.name);
    setType(acc.type);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateAccount.mutateAsync({ id: editing.id, input: { name, type } });
      } else {
        await createAccount.mutateAsync({ name, type, icon: 'business', color: '#22C55E', is_default: false });
      }
      setShowForm(false);
      setEditing(null);
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  const handleDeleteFromModal = () => {
    if (!editing || editing.is_default) return;
    Alert.alert(t('accounts.delete'), t('accounts.deleteConfirm', { name: editing.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount.mutateAsync(editing.id);
            setShowForm(false);
            setEditing(null);
          } catch (e) {
            Alert.alert(t('common.error'), getErrorMessage(e));
          }
        },
      },
    ]);
  };

  const handleTransfer = async () => {
    if (!fromId || !toId || fromId === toId) {
      Alert.alert(t('profile.accounts'), t('accounts.selectDifferent'));
      return;
    }
    if (transferAmount <= 0) {
      Alert.alert(t('common.amount'), t('accounts.amountRequired'));
      return;
    }
    try {
      await createTx.mutateAsync({
        type: 'transfer',
        amount: transferAmount,
        account_id: fromId,
        transfer_to_account_id: toId,
        category_id: null,
        description: transferNote.trim() || t('accounts.transferDefaultNote'),
        tags: [],
        transaction_date: new Date().toISOString(),
      });
      setShowTransfer(false);
      Alert.alert(t('common.done'), t('accounts.transferOk'));
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('accounts.title')} showBack />
      <ScreenContainer>
        <PrimarySaveButton title={t('accounts.add')} icon="add-circle" onPress={openCreate} style={{ marginBottom: 12 }} />

        <Pressable
          onPress={openTransfer}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            marginBottom: 16,
            backgroundColor: `${colors.primary}18`,
            borderRadius: radius,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <Ionicons name="swap-horizontal" size={22} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>{t('accounts.transfer')}</Text>
        </Pressable>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : accounts?.length ? (
          accounts.map((acc) => (
            <Card key={acc.id} style={{ marginBottom: 10 }}>
              <Pressable onPress={() => router.push(`/accounts/${acc.id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 16 }}>{acc.name}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
                    {typeLabels[acc.type] ?? acc.type}
                    {acc.is_default ? ` · ${t('accounts.defaultAccount')}` : ''}
                  </Text>
                </View>
                <Text style={{ color: Number(acc.balance) < 0 ? '#DC2626' : '#15803D', fontWeight: '700', fontSize: 16, marginRight: 8 }}>
                  {formatCurrency(Number(acc.balance), profile?.currency)}
                </Text>
                <Pressable onPress={() => openEdit(acc)} hitSlop={8} style={{ marginRight: 6 }}>
                  <Ionicons name="create-outline" size={20} color={colors.mutedForeground} />
                </Pressable>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </Pressable>
            </Card>
          ))
        ) : (
          <EmptyState title={t('accounts.empty')} subtitle={t('accounts.emptySub')} actionLabel={t('accounts.add')} onAction={openCreate} />
        )}
      </ScreenContainer>

      <FormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? t('accounts.edit') : t('accounts.new')}
        footer={
          <>
            <PrimarySaveButton
              title={editing ? t('profile.saveChanges') : t('accounts.create')}
              onPress={handleSave}
              loading={createAccount.isPending || updateAccount.isPending}
            />
            {editing && !editing.is_default ? (
              <Button title={t('accounts.delete')} variant="destructive" onPress={handleDeleteFromModal} loading={deleteAccount.isPending} />
            ) : null}
            <Button title={t('common.cancel')} variant="ghost" onPress={() => { setShowForm(false); setEditing(null); }} />
          </>
        }
      >
        <Input label={t('common.name')} value={name} onChangeText={setName} placeholder={t('accounts.namePlaceholder')} />
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', marginBottom: 8 }}>{t('common.type')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {ACCOUNT_TYPES.map((accType) => (
            <Pressable
              key={accType}
              onPress={() => setType(accType)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: radius,
                marginRight: 8,
                backgroundColor: type === accType ? colors.primary : colors.secondary,
                borderWidth: 1,
                borderColor: type === accType ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: type === accType ? colors.primaryForeground : colors.foreground, fontWeight: '500' }}>
                {typeLabels[accType]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FormModal>

      <FormModal
        visible={showTransfer}
        onClose={() => setShowTransfer(false)}
        title={t('accounts.transferTitle')}
        footer={
          <>
            <PrimarySaveButton title={t('accounts.confirmTransfer')} onPress={handleTransfer} loading={createTx.isPending} icon="swap-horizontal" />
            <Button title={t('common.cancel')} variant="ghost" onPress={() => setShowTransfer(false)} />
          </>
        }
      >
        <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 8 }}>{t('accounts.from')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {accounts?.map((acc) => (
            <Pressable
              key={acc.id}
              onPress={() => setFromId(acc.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: radius,
                backgroundColor: fromId === acc.id ? colors.primary : colors.secondary,
                borderWidth: 1,
                borderColor: fromId === acc.id ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: fromId === acc.id ? colors.primaryForeground : colors.foreground }}>{acc.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 8 }}>{t('accounts.to')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {accounts?.filter((a) => a.id !== fromId).map((acc) => (
            <Pressable
              key={acc.id}
              onPress={() => setToId(acc.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: radius,
                backgroundColor: toId === acc.id ? colors.primary : colors.secondary,
                borderWidth: 1,
                borderColor: toId === acc.id ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: toId === acc.id ? colors.primaryForeground : colors.foreground }}>{acc.name}</Text>
            </Pressable>
          ))}
        </View>

        <AmountCalculator value={transferAmount} onChange={setTransferAmount} showIva={false} />
        <Input label={t('common.noteOptional')} value={transferNote} onChangeText={setTransferNote} placeholder={t('accounts.transferNotePlaceholder')} />
      </FormModal>
    </View>
  );
}
