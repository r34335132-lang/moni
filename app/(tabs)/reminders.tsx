import React, { useState } from 'react';
import { View, Alert, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormModal } from '@/src/components/ui/FormModal';
import { useReminders, useAddReminder, useUpdateReminder, useDeleteReminder, useSendDailySummary } from '@/src/hooks/useReminders';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { Card, SectionLabel } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { DatePickerField } from '@/src/components/ui/DatePickerField';
import { TimePickerField } from '@/src/components/ui/TimePickerField';
import { IconActionButton } from '@/src/components/ui/IconActionButton';
import { PressableScale } from '@/src/components/ui/Glass';
import { AnimatedIn } from '@/src/components/AnimatedIn';
import { AppText, Font } from '@/src/components/ui/AppText';
import { formatDate } from '@/src/core/utils/format';
import { getErrorMessage } from '@/src/core/utils/errors';
import { notificationService, type LocalReminder, type ReminderRepeat } from '@/src/services/notificationService';

function defaultTime() {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function RemindersTabScreen() {
  const { user, profile } = useAuth();
  const { colors, radiusPill } = useTheme();
  const { t } = useLanguage();
  const { data: reminders, isLoading } = useReminders();
  const addReminder = useAddReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const sendSummary = useSendDailySummary();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LocalReminder | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [time, setTime] = useState(defaultTime);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [repeat, setRepeat] = useState<ReminderRepeat>('once');

  const repeatOptions: { id: ReminderRepeat; label: string }[] = [
    { id: 'once', label: t('reminders.once') },
    { id: 'daily', label: t('reminders.daily') },
    { id: 'weekly', label: t('reminders.weekly') },
    { id: 'monthly', label: t('reminders.monthly') },
  ];

  const repeatLabels: Record<ReminderRepeat, string> = {
    once: t('reminders.once'),
    daily: t('reminders.daily'),
    weekly: t('reminders.weekly'),
    monthly: t('reminders.monthly'),
  };

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setBody('');
    setTime(defaultTime());
    setDueDate(defaultDueDate());
    setRepeat('once');
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (r: LocalReminder) => {
    setEditing(r);
    setTitle(r.title);
    setBody(r.body);
    const tm = new Date();
    tm.setHours(r.hour, r.minute, 0, 0);
    setTime(tm);
    setDueDate(r.dueDate ? new Date(r.dueDate) : defaultDueDate());
    setRepeat(r.repeat ?? 'once');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('reminders.missingTitle'), t('reminders.missingTitleSub'));
      return;
    }
    const payload = {
      title: title.trim(),
      body: body.trim() || t('reminders.defaultBody', { title: title.trim() }),
      hour: time.getHours(),
      minute: time.getMinutes(),
      dueDate: repeat === 'daily' ? null : dueDate.toISOString(),
      repeat,
      days: [] as number[],
      enabled: true,
    };
    try {
      if (editing) {
        await updateReminder.mutateAsync({ id: editing.id, patch: payload });
      } else {
        await addReminder.mutateAsync(payload);
      }
      setShowForm(false);
      resetForm();
      Alert.alert(t('common.done'), t('reminders.savedOk'));
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e));
    }
  };

  const handleDelete = (r: LocalReminder) => {
    Alert.alert(t('reminders.deleteReminder'), t('reminders.deleteConfirm', { title: r.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteReminder.mutate(r.id) },
    ]);
  };

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermissions();
    if (granted && user) {
      await notificationService.refreshAll(user.id, profile?.currency ?? 'MXN', { force: true });
      Alert.alert(t('common.done'), t('reminders.notificationsEnabled'));
    } else {
      Alert.alert(t('common.permissionRequired'), t('reminders.permissionDenied'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('reminders.title')} subtitle={t('reminders.subtitle')} />
      <ScreenContainer>
        <AnimatedIn>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            <PressableScale
              onPress={handleEnableNotifications}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 20,
                paddingVertical: 14,
                paddingHorizontal: 12,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 3 },
                elevation: 2,
              }}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              <AppText style={{ fontFamily: Font.semibold, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                {t('reminders.enablePush')}
              </AppText>
            </PressableScale>
            <PressableScale
              onPress={() => sendSummary.mutate()}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 20,
                paddingVertical: 14,
                paddingHorizontal: 12,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 3 },
                elevation: 2,
              }}
            >
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
              <AppText style={{ fontFamily: Font.semibold, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                {t('reminders.viewTodaySummary')}
              </AppText>
            </PressableScale>
          </View>
        </AnimatedIn>

        <AnimatedIn index={1}>
          <PressableScale
            onPress={openCreate}
            style={{
              alignSelf: 'stretch',
              borderRadius: radiusPill,
              backgroundColor: colors.primary,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              marginBottom: 22,
              shadowColor: colors.primary,
              shadowOpacity: 0.28,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Ionicons name="add" size={20} color={colors.primaryForeground} />
            <AppText style={{ fontFamily: Font.semibold, fontSize: 16, color: colors.primaryForeground }}>
              {t('reminders.add')}
            </AppText>
          </PressableScale>
        </AnimatedIn>

        <SectionLabel>{t('reminders.title')}</SectionLabel>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : reminders?.length ? (
          reminders.map((r, index) => (
            <AnimatedIn key={r.id} index={index + 2}>
              <PressableScale onPress={() => openEdit(r)} scaleTo={0.98}>
                <Card style={{ marginBottom: 10 }} padding={14}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 16,
                        backgroundColor: r.enabled ? colors.accent : colors.fill,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="alarm-outline"
                        size={22}
                        color={r.enabled ? colors.primary : colors.mutedForeground}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText style={{ fontFamily: Font.semibold, fontSize: 16 }} numberOfLines={1}>
                        {r.title}
                      </AppText>
                      <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                        {repeatLabels[r.repeat ?? 'once']} · {String(r.hour).padStart(2, '0')}:
                        {String(r.minute).padStart(2, '0')}
                        {r.dueDate ? ` · ${formatDate(r.dueDate, 'd MMM')}` : ''}
                      </AppText>
                    </View>
                    <Switch
                      value={r.enabled}
                      onValueChange={(v) => updateReminder.mutate({ id: r.id, patch: { enabled: v } })}
                      trackColor={{ true: colors.primary, false: colors.fill }}
                    />
                    <IconActionButton
                      variant="delete"
                      size="sm"
                      onPress={() => handleDelete(r)}
                      accessibilityLabel={t('common.delete')}
                    />
                  </View>
                </Card>
              </PressableScale>
            </AnimatedIn>
          ))
        ) : (
          <EmptyState
            title={t('reminders.empty')}
            subtitle={t('reminders.emptySub')}
            icon="alarm-outline"
            actionLabel={t('reminders.add')}
            onAction={openCreate}
          />
        )}

        <FormModal
          visible={showForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          title={editing ? t('reminders.editReminder') : t('reminders.newReminder')}
          footer={
            <>
              <PrimarySaveButton
                title={editing ? t('profile.saveChanges') : t('reminders.saveReminder')}
                onPress={handleSave}
                loading={addReminder.isPending || updateReminder.isPending}
              />
              {editing ? (
                <Button
                  title={t('reminders.deleteReminder')}
                  variant="destructive"
                  onPress={() => {
                    setShowForm(false);
                    handleDelete(editing);
                  }}
                />
              ) : null}
              <Button
                title={t('common.cancel')}
                variant="ghost"
                onPress={() => {
                  setShowForm(false);
                  resetForm();
                }}
              />
            </>
          }
        >
          <Input label={t('reminders.whatToPay')} value={title} onChangeText={setTitle} placeholder={t('reminders.whatToPayPlaceholder')} />
          <Input
            label={t('reminders.notificationMessage')}
            value={body}
            onChangeText={setBody}
            placeholder={t('reminders.notificationPlaceholder')}
          />

          <AppText style={{ fontFamily: Font.medium, fontSize: 14, marginBottom: 8 }}>{t('reminders.repeat')}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {repeatOptions.map((opt) => {
              const selected = repeat === opt.id;
              return (
                <PressableScale
                  key={opt.id}
                  onPress={() => setRepeat(opt.id)}
                  style={{
                    paddingHorizontal: 16,
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
                    {opt.label}
                  </AppText>
                </PressableScale>
              );
            })}
          </View>

          {repeat !== 'daily' ? (
            <DatePickerField
              label={
                repeat === 'once'
                  ? t('reminders.paymentDate')
                  : repeat === 'weekly'
                    ? t('reminders.weekDayRef')
                    : t('reminders.monthDayRef')
              }
              value={dueDate}
              onChange={setDueDate}
              minimumDate={repeat === 'once' ? new Date() : undefined}
            />
          ) : null}

          <TimePickerField label={t('reminders.alertTime')} value={time} onChange={setTime} />
        </FormModal>
      </ScreenContainer>
    </View>
  );
}
