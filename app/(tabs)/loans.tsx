import React, { useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLoans } from '@/src/hooks/useLoans';
import { useMoneyLent } from '@/src/hooks/useMoneyLent';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card, SectionLabel } from '@/src/components/ui/Card';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { EmptyState } from '@/src/components/EmptyState';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { PressableScale } from '@/src/components/ui/Glass';
import { AppText, Font } from '@/src/components/ui/AppText';
import { MoneyDisplay } from '@/src/components/ui/MoneyDisplay';
import { formatCurrency, formatDate } from '@/src/core/utils/format';
import type { Loan, MoneyLent } from '@/src/core/types/entities';

function LoanCard({
  title,
  remaining,
  progress,
  subtitle,
  note,
  tone,
  progressColor,
  icon,
  iconBg,
  onPress,
  index = 0,
}: {
  title: string;
  remaining: number;
  progress: number;
  subtitle: string;
  note?: string | null;
  tone: 'income' | 'expense' | 'neutral';
  progressColor?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  onPress: () => void;
  index?: number;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'MXN';
  const iconColor =
    tone === 'income' ? colors.primary : tone === 'expense' ? colors.destructive : colors.mutedForeground;

  return (
    <AnimatedIn index={index}>
      <PressableScale onPress={onPress} scaleTo={0.98}>
        <Card style={{ marginBottom: 10 }} padding={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: iconBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText style={{ fontFamily: Font.semibold, fontSize: 16 }} numberOfLines={1}>
                {title}
              </AppText>
              <AppText style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                {subtitle}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </View>

          <MoneyDisplay
            amount={remaining}
            currency={currency}
            tone={tone}
            size="md"
            align="left"
            style={{ marginBottom: 10 }}
          />

          <ProgressBar progress={progress} color={progressColor ?? iconColor} showLabel={false} />
          {note ? (
            <AppText style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8 }} numberOfLines={2}>
              {t('loans.note')}: {note}
            </AppText>
          ) : null}
        </Card>
      </PressableScale>
    </AnimatedIn>
  );
}

export default function LoansScreen() {
  const { profile } = useAuth();
  const { colors, radiusPill, isDark } = useTheme();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'MXN';
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { data: moneyLent, isLoading: loadingLent } = useMoneyLent();

  const isLoading = loadingLoans || loadingLent;

  const pendingLoans = useMemo(() => (loans ?? []).filter((l) => l.status === 'pending'), [loans]);
  const paidLoans = useMemo(() => (loans ?? []).filter((l) => l.status === 'paid_off'), [loans]);
  const pendingLent = useMemo(() => (moneyLent ?? []).filter((m) => m.status === 'pending'), [moneyLent]);
  const paidLent = useMemo(() => (moneyLent ?? []).filter((m) => m.status === 'paid_off'), [moneyLent]);

  const totalOwe = pendingLoans.reduce((s, l) => s + Number(l.remaining_balance || 0), 0);
  const totalCollect = pendingLent.reduce((s, m) => s + Number(m.remaining_balance || 0), 0);

  const renderBorrowed = (loan: Loan, paidOff: boolean, index: number) => {
    const amount = Number(loan.amount || 0);
    const remaining = Number(loan.remaining_balance || 0);
    const progress = amount > 0 ? ((amount - remaining) / amount) * 100 : 0;
    return (
      <LoanCard
        key={loan.id}
        index={index}
        title={loan.lender}
        remaining={remaining}
        progress={progress}
        tone={paidOff ? 'neutral' : 'expense'}
        iconBg={paidOff ? colors.fill : 'rgba(229,72,77,0.12)'}
        icon="arrow-down"
        subtitle={
          paidOff
            ? `${t('loans.paidOffLabel')} · ${formatCurrency(amount, currency)}`
            : `${t('loans.original')}: ${formatCurrency(amount, currency)}${loan.due_date ? ` · ${formatDate(loan.due_date, 'd MMM')}` : ''}`
        }
        note={loan.notes}
        onPress={() => router.push(`/loans/${loan.id}?type=borrowed`)}
      />
    );
  };

  const renderLent = (item: MoneyLent, paidOff: boolean, index: number) => {
    const amount = Number(item.amount || 0);
    const remaining = Number(item.remaining_balance || 0);
    const progress = amount > 0 ? ((amount - remaining) / amount) * 100 : 0;
    return (
      <LoanCard
        key={item.id}
        index={index}
        title={item.debtor_name}
        remaining={remaining}
        progress={progress}
        tone={paidOff ? 'neutral' : 'income'}
        progressColor={colors.primary}
        iconBg={paidOff ? colors.fill : colors.accent}
        icon="arrow-up"
        subtitle={
          paidOff
            ? `${t('loans.collectedLabel')} · ${item.concept ?? t('loans.noConcept')}`
            : `${item.concept ?? t('loans.noConcept')} · ${formatDate(item.lent_date, 'd MMM')}`
        }
        onPress={() => router.push(`/loans/${item.id}?type=lent`)}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('loans.title')} subtitle={t('loans.subtitle')} />
      <ScreenContainer>
        <AnimatedIn>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            <Card style={{ flex: 1, minWidth: 0 }} padding={14}>
              <MoneyDisplay
                amount={totalOwe}
                currency={currency}
                tone="expense"
                size="md"
                label={t('loans.iOwe')}
              />
            </Card>
            <Card style={{ flex: 1, minWidth: 0 }} padding={14}>
              <MoneyDisplay
                amount={totalCollect}
                currency={currency}
                tone="income"
                size="md"
                label={t('loans.theyOweMe')}
              />
            </Card>
          </View>
        </AnimatedIn>

        <AnimatedIn index={1}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
            <PressableScale
              onPress={() => router.push('/loans/create-borrowed')}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: radiusPill,
                paddingVertical: 16,
                alignItems: 'center',
                shadowColor: colors.primary,
                shadowOpacity: 0.28,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }}
            >
              <Ionicons name="arrow-down-circle" size={26} color={colors.primaryForeground} />
              <AppText style={{ color: colors.primaryForeground, fontFamily: Font.semibold, marginTop: 6, fontSize: 13 }}>
                {t('loans.requestLoan')}
              </AppText>
            </PressableScale>
            <PressableScale
              onPress={() => router.push('/loans/create-lent')}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radiusPill,
                paddingVertical: 16,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.25 : 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}
            >
              <Ionicons name="arrow-up-circle" size={26} color={colors.primary} />
              <AppText style={{ color: colors.foreground, fontFamily: Font.semibold, marginTop: 6, fontSize: 13 }}>
                {t('loans.lendMoney')}
              </AppText>
            </PressableScale>
          </View>
        </AnimatedIn>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <SectionLabel>{t('loans.iOwe')}</SectionLabel>
            {pendingLoans.length ? (
              pendingLoans.map((loan, i) => renderBorrowed(loan, false, i))
            ) : pendingLent.length === 0 && paidLoans.length === 0 && paidLent.length === 0 ? (
              <EmptyState
                title={t('loans.noDebts')}
                subtitle={t('loans.noDebtsSub')}
                icon="cash-outline"
                actionLabel={t('loans.requestLoan')}
                onAction={() => router.push('/loans/create-borrowed')}
              />
            ) : (
              <EmptyState title={t('loans.noDebts')} subtitle={t('loans.noDebtsSub')} icon="checkmark-circle-outline" />
            )}

            {paidLoans.length > 0 ? (
              <>
                <SectionLabel>{t('loans.historyPaidOff')}</SectionLabel>
                {paidLoans.map((loan, i) => renderBorrowed(loan, true, i))}
              </>
            ) : null}

            <SectionLabel>{t('loans.theyOweMe')}</SectionLabel>
            {pendingLent.length ? (
              pendingLent.map((item, i) => renderLent(item, false, i))
            ) : pendingLoans.length > 0 || paidLoans.length > 0 || paidLent.length > 0 ? (
              <EmptyState title={t('loans.noCollections')} subtitle={t('loans.noCollectionsSub')} icon="happy-outline" />
            ) : null}

            {paidLent.length > 0 ? (
              <>
                <SectionLabel>{t('loans.historyCollected')}</SectionLabel>
                {paidLent.map((item, i) => renderLent(item, true, i))}
              </>
            ) : null}
          </>
        )}
      </ScreenContainer>
    </View>
  );
}
