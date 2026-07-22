import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface Reminder {
  id: string;
  title: string;
  dueDay: number;
  amount: number;
  category: string;
  active: boolean;
  createdAt: string;
}

interface RemindersContextType {
  reminders: Reminder[];
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

const STORAGE_KEY = '@moni_reminders_v2';
const INIT_KEY = '@moni_reminders_init_v2';

function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getSampleReminders(): Reminder[] {
  return [
    { id: makeId(), title: 'Renta', dueDay: 1, amount: 8000, category: 'casa', active: true, createdAt: new Date().toISOString() },
    { id: makeId(), title: 'Internet', dueDay: 10, amount: 450, category: 'servicios', active: true, createdAt: new Date().toISOString() },
    { id: makeId(), title: 'Tarjeta Banorte', dueDay: 20, amount: 0, category: 'impuestos', active: true, createdAt: new Date().toISOString() },
    { id: makeId(), title: 'Netflix', dueDay: 7, amount: 180, category: 'entretenimiento', active: false, createdAt: new Date().toISOString() },
  ];
}

const RemindersContext = createContext<RemindersContextType | null>(null);

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const initialized = await AsyncStorage.getItem(INIT_KEY);
        if (!initialized) {
          const sample = getSampleReminders();
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
          await AsyncStorage.setItem(INIT_KEY, 'true');
          setReminders(sample);
        } else {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) setReminders(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const persist = async (data: Reminder[]) => {
    setReminders(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const addReminder = useCallback(
    async (r: Omit<Reminder, 'id' | 'createdAt'>) => {
      await persist([...reminders, { ...r, id: makeId(), createdAt: new Date().toISOString() }]);
    },
    [reminders],
  );

  const updateReminder = useCallback(
    async (id: string, updates: Partial<Reminder>) => {
      await persist(reminders.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    },
    [reminders],
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      await persist(reminders.filter((r) => r.id !== id));
    },
    [reminders],
  );

  return (
    <RemindersContext.Provider value={{ reminders, addReminder, updateReminder, deleteReminder }}>
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders must be used inside RemindersProvider');
  return ctx;
}
