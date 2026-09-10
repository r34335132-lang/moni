import React, { useState } from 'react';
import { View, Text, Alert, Pressable, Switch, ActivityIndicator } from 'react-native';
import { FormModal } from '@/src/components/ui/FormModal';
import { Ionicons } from '@expo/vector-icons';
import { useReminders, useAddReminder, useUpdateReminder, useDeleteReminder, useSendDailySummary } from '@/src/hooks/useReminders';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { DatePickerField } from '@/src/components/ui/DatePickerField';
import { TimePickerField } from '@/src/components/ui/TimePickerField';
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
  const { colors, radius } = useTheme();
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
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 8 }}>{t('reminders.autoNotifications')}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
            {t('reminders.autoNotificationsDesc')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button title={t('reminders.enablePush')} onPress={handleEnableNotifications} size="sm" />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t('reminders.viewTodaySummary')} variant="secondary" size="sm" loading={sendSummary.isPending} onPress={() => sendSummary.mutate()} />
            </View>
          </View>
        </Card>

        <PrimarySaveButton title={t('reminders.add')} icon="add-circle" onPress={openCreate} style={{ marginBottom: 16 }} />

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : reminders?.length ? (
          reminders.map((r) => (
            <Card key={r.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => openEdit(r)} style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{r.title}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                  {repeatLabels[r.repeat ?? 'once']} · {String(r.hour).padStart(2, '0')}:{String(r.minute).padStart(2, '0')}
                  {r.dueDate ? ` · ${formatDate(r.dueDate, 'd MMM yyyy')}` : ''}
                </Text>
                {r.body ? (
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }} numberOfLines={2}>
                    {r.body}
                  </Text>
                ) : null}
              </Pressable>
              <Switch
                value={r.enabled}
                onValueChange={(v) => updateReminder.mutate({ id: r.id, patch: { enabled: v } })}
                trackColor={{ true: colors.primary }}
              />
              <Pressable onPress={() => handleDelete(r)} style={{ marginLeft: 8, padding: 4 }} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              </Pressable>
            </Card>
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
          onClose={() => { setShowForm(false); resetForm(); }}
          title={editing ? t('reminders.editReminder') : t('reminders.newReminder')}
          footer={
            <>
              <PrimarySaveButton
                title={editing ? t('profile.saveChanges') : t('reminders.saveReminder')}
                onPress={handleSave}
                loading={addReminder.isPending || updateReminder.isPending}
              />
              {editing ? (
                <Button title={t('reminders.deleteReminder')} variant="destructive" onPress={() => { setShowForm(false); handleDelete(editing); }} />
              ) : null}
              <Button title={t('common.cancel')} variant="ghost" onPress={() => { setShowForm(false); resetForm(); }} />
            </>
          }
        >
          <Input label={t('reminders.whatToPay')} value={title} onChangeText={setTitle} placeholder={t('reminders.whatToPayPlaceholder')} />
          <Input label={t('reminders.notificationMessage')} value={body} onChangeText={setBody} placeholder={t('reminders.notificationPlaceholder')} />

          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', marginBottom: 8 }}>{t('reminders.repeat')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {repeatOptions.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => setRepeat(opt.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: radius,
                  backgroundColor: repeat === opt.id ? colors.primary : colors.secondary,
                  borderWidth: 1,
                  borderColor: repeat === opt.id ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: repeat === opt.id ? colors.primaryForeground : colors.foreground, fontWeight: '600' }}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {repeat !== 'daily' && (
            <DatePickerField
              label={repeat === 'once' ? t('reminders.paymentDate') : repeat === 'weekly' ? t('reminders.weekDayRef') : t('reminders.monthDayRef')}
              value={dueDate}
              onChange={setDueDate}
              minimumDate={repeat === 'once' ? new Date() : undefined}
            />
          )}

          <TimePickerField label={t('reminders.alertTime')} value={time} onChange={setTime} />
        </FormModal>
      </ScreenContainer>
    </View>
  );
}
