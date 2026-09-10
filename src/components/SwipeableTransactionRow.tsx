import React, { useRef } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { TransactionRow } from '@/src/components/TransactionRow';
import { useLanguage } from '@/src/providers/LanguageProvider';
import type { Transaction } from '@/src/core/types/entities';

interface SwipeableTransactionRowProps {
  transaction: Transaction;
  currency?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function SwipeableTransactionRow({ transaction, currency, onEdit, onDelete }: SwipeableTransactionRowProps) {
  const swipeRef = useRef<Swipeable>(null);
  const { t } = useLanguage();

  const confirmDelete = () => {
    Alert.alert(
      t('smartFill.deleteMovement'),
      t('smartFill.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => swipeRef.current?.close() },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            swipeRef.current?.close();
            onDelete();
          },
        },
      ],
    );
  };

  const renderActions = () => (
    <View style={{ flexDirection: 'row', marginBottom: 8, marginLeft: 8 }}>
      <Pressable
        onPress={() => { swipeRef.current?.close(); onEdit(); }}
        style={{
          width: 72,
          backgroundColor: '#3B82F6',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
        }}
      >
        <Ionicons name="pencil" size={20} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginTop: 4 }}>{t('smartFill.edit')}</Text>
      </Pressable>
      <Pressable
        onPress={confirmDelete}
        style={{
          width: 72,
          backgroundColor: '#DC2626',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="trash" size={20} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginTop: 4 }}>{t('smartFill.delete')}</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderActions} overshootRight={false}>
      <TransactionRow transaction={transaction} currency={currency} onPress={onEdit} />
    </Swipeable>
  );
}
