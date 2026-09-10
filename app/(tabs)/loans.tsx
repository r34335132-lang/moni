import React, { useMemo } from 'react';

import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLoans } from '@/src/hooks/useLoans';
import { useMoneyLent } from '@/src/hooks/useMoneyLent';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { EmptyState } from '@/src/components/EmptyState';
import { formatCurrency, formatDate } from '@/src/core/utils/format';
import type { Loan, MoneyLent } from '@/src/core/types/entities';

function LoanCard({
  title,
  remaining,
  original,
  progress,
  subtitle,
  note,
  amountColor,
  progressColor,
  onPress,
}: {
  title: string;
  remaining: number;
  original: number;
  progress: number;
  subtitle: string;
  note?: string | null;
  amountColor: string;
  progressColor?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'MXN';

  return (
    <Pressable onPress={onPress}>
      <Card style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 16, flex: 1, marginRight: 8 }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ color: amountColor, fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(remaining, currency)}
          </Text>
        </View>
        <ProgressBar progress={progress} color={progressColor} />
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>{subtitle}</Text>
        {note ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
            {t('loans.note')}: {note}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

export default function LoansScreen() {
  const { profile } = useAuth();
  const { colors, radius } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { data: moneyLent, isLoading: loadingLent } = useMoneyLent();

  const isLoading = loadingLoans || loadingLent;

  const pendingLoans = useMemo(() => (loans ?? []).filter((l) => l.status === 'pending'), [loans]);
  const paidLoans = useMemo(() => (loans ?? []).filter((l) => l.status === 'paid_off'), [loans]);
  const pendingLent = useMemo(() => (moneyLent ?? []).filter((m) => m.status === 'pending'), [moneyLent]);
  const paidLent = useMemo(() => (moneyLent ?? []).filter((m) => m.status === 'paid_off'), [moneyLent]);

  const renderBorrowed = (loan: Loan, paidOff: boolean) => {
    const progress = ((Number(loan.amount) - Number(loan.remaining_balance)) / Number(loan.amount)) * 100;
    return (
      <LoanCard
        key={loan.id}
        title={loan.lender}
        remaining={Number(loan.remaining_balance)}
        original={Number(loan.amount)}
        progress={progress}
        amountColor={paidOff ? colors.mutedForeground : colors.destructive}
        subtitle={
          paidOff
            ? `${t('loans.paidOffLabel')} · ${t('loans.original')}: ${formatCurrency(Number(loan.amount), currency)}`
            : `${t('loans.original')}: ${formatCurrency(Number(loan.amount), currency)}${loan.due_date ? ` · ${t('loans.due')}: ${formatDate(loan.due_date)}` : ''}`
        }
        note={loan.notes}
        onPress={() => router.push(`/loans/${loan.id}?type=borrowed`)}
      />
    );
  };

  const renderLent = (item: MoneyLent, paidOff: boolean) => {
    const progress = ((Number(item.amount) - Number(item.remaining_balance)) / Number(item.amount)) * 100;
    return (
      <LoanCard
        key={item.id}
        title={item.debtor_name}
        remaining={Number(item.remaining_balance)}
        original={Number(item.amount)}
        progress={progress}
        amountColor={paidOff ? colors.mutedForeground : colors.primary}
        progressColor={colors.primary}
        subtitle={
          paidOff
            ? `${t('loans.collectedLabel')} · ${item.concept ?? t('loans.noConcept')} · ${formatDate(item.lent_date)}`
            : `${item.concept ?? t('loans.noConcept')} · ${formatDate(item.lent_date)}`
        }
        onPress={() => router.push(`/loans/${item.id}?type=lent`)}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('loans.title')} subtitle={t('loans.subtitle')} />
      <ScreenContainer>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <Pressable
            onPress={() => router.push('/loans/create-borrowed')}
            style={{ flex: 1, backgroundColor: colors.primary, borderRadius: radius, padding: 14, alignItems: 'center' }}
          >
            <Ionicons name="arrow-down-circle" size={24} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontWeight: '600', marginTop: 6, fontSize: 13 }}>{t('loans.requestLoan')}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/loans/create-lent')}
            style={{ flex: 1, backgroundColor: colors.secondary, borderRadius: radius, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="arrow-up-circle" size={24} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontWeight: '600', marginTop: 6, fontSize: 13 }}>{t('loans.lendMoney')}</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '600', marginBottom: 12 }}>{t('loans.iOwe')}</Text>
            {pendingLoans.length ? (
              pendingLoans.map((loan) => renderBorrowed(loan, false))
            ) : (
              <EmptyState title={t('loans.noDebts')} subtitle={t('loans.noDebtsSub')} icon="checkmark-circle-outline" />
            )}

            {paidLoans.length > 0 ? (
              <>
                <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 12 }}>
                  {t('loans.historyPaidOff')}
                </Text>
                {paidLoans.map((loan) => renderBorrowed(loan, true))}
              </>
            ) : null}

            <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 12 }}>{t('loans.theyOweMe')}</Text>
            {pendingLent.length ? (
              pendingLent.map((item) => renderLent(item, false))
            ) : (
              <EmptyState title={t('loans.noCollections')} subtitle={t('loans.noCollectionsSub')} icon="happy-outline" />
            )}

            {paidLent.length > 0 ? (
              <>
                <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 12 }}>
                  {t('loans.historyCollected')}
                </Text>
                {paidLent.map((item) => renderLent(item, true))}
              </>
            ) : null}
          </>
        )}
      </ScreenContainer>
    </View>
  );
}
