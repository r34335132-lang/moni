import React, { useRef } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { TransactionRow } from '@/src/components/TransactionRow';
import { SwipeActionPill } from '@/src/components/ui/IconActionButton';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import type { Transaction } from '@/src/core/types/entities';

interface SwipeableTransactionRowProps {
  transaction: Transaction;
  currency?: string;
  onEdit: () => void;
  onDelete: () => void;
  isLast?: boolean;
  otherMonthLabel?: string | null;
}

export function SwipeableTransactionRow({
  transaction,
  currency,
  onEdit,
  onDelete,
  isLast,
  otherMonthLabel,
}: SwipeableTransactionRowProps) {
  const swipeRef = useRef<Swipeable>(null);
  const { t } = useLanguage();
  const { colors } = useTheme();

  const confirmDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    Alert.alert(t('smartFill.deleteMovement'), t('smartFill.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel', onPress: () => swipeRef.current?.close() },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          swipeRef.current?.close();
          onDelete();
        },
      },
    ]);
  };

  const renderActions = () => (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', backgroundColor: colors.card }}>
      <SwipeActionPill
        variant="edit"
        label={t('smartFill.edit')}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
          swipeRef.current?.close();
          onEdit();
        }}
      />
      <SwipeActionPill
        variant="delete"
        label={t('smartFill.delete')}
        onPress={confirmDelete}
      />
    </View>
  );

  return (
    <View
      style={{
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
        backgroundColor: colors.card,
        overflow: 'hidden',
      }}
    >
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderActions}
        overshootRight={false}
        friction={1.6}
        rightThreshold={36}
      >
        <View style={{ backgroundColor: colors.card }}>
          <TransactionRow transaction={transaction} currency={currency} otherMonthLabel={otherMonthLabel} />
        </View>
      </Swipeable>
    </View>
  );
}
