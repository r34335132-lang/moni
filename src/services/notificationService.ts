import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getQuoteForDayNumber } from '@/src/core/constants/motivationalQuotes';
import { transactionRepository } from '@/src/data/repositories/transactionRepository';
import { getDayDateRange } from '@/src/core/utils/format';
import { logger } from '@/src/core/utils/logger';
import {
  buildDailySummaryBody,
  buildDailySummaryTitle,
} from '@/src/services/dailySummaryBuilder';

const STORAGE_KEY = '@moni_notification_ids';
const REMINDERS_KEY = '@moni_reminders_v1';
const LAST_REFRESH_KEY = '@moni_notifications_last_refresh';
const QUOTE_SENT_DAY_KEY = '@moni_quote_sent_day';

const IDENTIFIERS = {
  dailyQuote: 'moni-daily-quote',
  dailySummary: 'moni-daily-summary',
  reminder: (id: string) => `moni-reminder-${id}`,
} as const;

let refreshLock: Promise<void> | null = null;

export type ReminderRepeat = 'once' | 'daily' | 'weekly' | 'monthly';

export interface LocalReminder {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  /** Fecha de referencia / pago único (ISO). */
  dueDate: string | null;
  repeat: ReminderRepeat;
  days: number[];
  enabled: boolean;
  notificationId?: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function saveNotificationIds(ids: string[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}

async function getNotificationIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function cancelIdentifier(identifier: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    /* noop */
  }
}

async function getRemindersFromStorage(): Promise<LocalReminder[]> {
  const raw = await AsyncStorage.getItem(REMINDERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function purgeAllScheduled() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    /* noop */
  }
  await saveNotificationIds([]);
}

async function cancelAllMoniScheduled() {
  const stored = await getNotificationIds();
  await Promise.all(stored.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  await cancelIdentifier(IDENTIFIERS.dailyQuote);
  await cancelIdentifier(IDENTIFIERS.dailySummary);
  const reminders = await getRemindersFromStorage();
  await Promise.all(reminders.map((r) => cancelIdentifier(IDENTIFIERS.reminder(r.id))));
  await saveNotificationIds([]);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async cancelMoniNotifications() {
    await purgeAllScheduled();
  },

  /** Exactamente UNA frase al día a las 8:00 */
  async scheduleDailyMotivationalQuote(): Promise<string> {
    const granted = await this.requestPermissions();
    if (!granted) return '';

    await cancelIdentifier(IDENTIFIERS.dailyQuote);

    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const quote = getQuoteForDayNumber(dayOfYear);

    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIERS.dailyQuote,
      content: {
        title: '💚 Tu frase del día — MONI',
        body: quote,
        data: { type: 'motivational', dayOfYear },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });

    return IDENTIFIERS.dailyQuote;
  },

  /** Enviar frase manualmente — máximo 1 por día */
  async sendInstantQuote(): Promise<boolean> {
    const granted = await this.requestPermissions();
    if (!granted) return false;

    const day = todayKey();
    const lastSent = await AsyncStorage.getItem(QUOTE_SENT_DAY_KEY);
    if (lastSent === day) return false;

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const quote = getQuoteForDayNumber(dayOfYear);

    await Notifications.scheduleNotificationAsync({
      identifier: `moni-manual-quote-${day}`,
      content: {
        title: '💚 Tu frase del día — MONI',
        body: quote,
        data: { type: 'motivational_manual' },
      },
      trigger: null,
    });

    await AsyncStorage.setItem(QUOTE_SENT_DAY_KEY, day);
    return true;
  },

  /** Un resumen al día a las 20:00 con todos los movimientos registrados */
  async scheduleDailySummary(userId: string, currency: string): Promise<string> {
    const granted = await this.requestPermissions();
    if (!granted) return '';

    await cancelIdentifier(IDENTIFIERS.dailySummary);

    const { startDate, endBefore } = getDayDateRange();
    const transactions = await transactionRepository.getAll(userId, { startDate, endBefore });
    const body = buildDailySummaryBody(transactions, currency);
    const title = buildDailySummaryTitle(transactions.length);

    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIERS.dailySummary,
      content: {
        title,
        body,
        data: { type: 'daily_summary', count: transactions.length },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });

    return IDENTIFIERS.dailySummary;
  },

  async refreshAll(userId: string, currency: string, options?: { force?: boolean }) {
    if (Platform.OS === 'web') return;

    const lastRaw = await AsyncStorage.getItem(LAST_REFRESH_KEY);
    const lastRefresh = lastRaw ? Number(lastRaw) : 0;
    const debounceMs = 5 * 60 * 1000;

    if (!options?.force && Date.now() - lastRefresh < debounceMs) return;
    if (refreshLock) return refreshLock;

    refreshLock = (async () => {
      try {
        if (options?.force) {
          await purgeAllScheduled();
        } else {
          await cancelAllMoniScheduled();
        }

        const quoteId = await this.scheduleDailyMotivationalQuote();
        const summaryId = await this.scheduleDailySummary(userId, currency);
        const reminderIds = await this.rescheduleLocalReminders();

        const allIds = [quoteId, summaryId, ...reminderIds].filter(Boolean);
        await saveNotificationIds(allIds);
        await AsyncStorage.setItem(LAST_REFRESH_KEY, String(Date.now()));

        logger.info('Notifications', 'Scheduled', { count: allIds.length });
      } catch (e) {
        logger.error('Notifications', 'Refresh failed', e);
      } finally {
        refreshLock = null;
      }
    })();

    return refreshLock;
  },

  async sendInstantSummary(userId: string, currency: string) {
    const granted = await this.requestPermissions();
    if (!granted) return;

    const { startDate, endBefore } = getDayDateRange();
    const transactions = await transactionRepository.getAll(userId, { startDate, endBefore });
    const body = buildDailySummaryBody(transactions, currency);
    const title = buildDailySummaryTitle(transactions.length);

    await Notifications.scheduleNotificationAsync({
      identifier: `moni-instant-summary-${Date.now()}`,
      content: {
        title,
        body,
        data: { type: 'daily_summary_instant', count: transactions.length },
      },
      trigger: null,
    });
  },

  async getReminders(): Promise<LocalReminder[]> {
    const raw = await getRemindersFromStorage();
    return raw.map((r) => ({
      ...r,
      dueDate: r.dueDate ?? null,
      repeat: r.repeat ?? (r.dueDate ? 'once' : 'daily'),
    }));
  },

  async saveReminders(reminders: LocalReminder[]) {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  },

  async rescheduleLocalReminders(): Promise<string[]> {
    const reminders = await this.getReminders();
    const ids: string[] = [];

    for (const r of reminders.filter((x) => x.enabled)) {
      const identifier = IDENTIFIERS.reminder(r.id);
      await cancelIdentifier(identifier);

      const repeat = r.repeat ?? (r.dueDate ? 'once' : 'daily');
      let trigger: Notifications.NotificationTriggerInput;

      if (repeat === 'once') {
        if (!r.dueDate) continue;
        const due = new Date(r.dueDate);
        due.setHours(r.hour, r.minute, 0, 0);
        if (due <= new Date()) continue;
        trigger = { type: Notifications.SchedulableTriggerInputTypes.DATE, date: due };
      } else if (repeat === 'daily') {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: r.hour,
          minute: r.minute,
        };
      } else if (repeat === 'weekly') {
        const ref = r.dueDate ? new Date(r.dueDate) : new Date();
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: ref.getDay() + 1,
          hour: r.hour,
          minute: r.minute,
        };
      } else {
        const ref = r.dueDate ? new Date(r.dueDate) : new Date();
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: ref.getDate(),
          hour: r.hour,
          minute: r.minute,
        };
      }

      const repeatLabel = { once: 'Pago único', daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual' }[repeat];

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: r.title,
          body: r.body || `${repeatLabel}: ${r.title}`,
          data: { type: 'payment_reminder', reminderId: r.id, dueDate: r.dueDate, repeat },
        },
        trigger,
      });
      ids.push(identifier);
    }
    return ids;
  },

  async addReminder(reminder: Omit<LocalReminder, 'id' | 'notificationId'>): Promise<LocalReminder> {
    const list = await this.getReminders();
    const newReminder: LocalReminder = { ...reminder, id: `rem_${Date.now()}` };
    list.push(newReminder);
    await this.saveReminders(list);
    return newReminder;
  },

  async updateReminder(id: string, patch: Partial<LocalReminder>) {
    const list = await this.getReminders();
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch };
      await this.saveReminders(list);
    }
  },

  async deleteReminder(id: string) {
    const list = await this.getReminders();
    await cancelIdentifier(IDENTIFIERS.reminder(id));
    await this.saveReminders(list.filter((r) => r.id !== id));
  },
};
