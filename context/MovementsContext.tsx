import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface Movement {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

interface MovementsContextType {
  movements: Movement[];
  addMovement: (movement: Omit<Movement, 'id' | 'createdAt'>) => Promise<void>;
  updateMovement: (id: string, updates: Partial<Movement>) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEY = '@moni_movements_v2';
const INIT_KEY = '@moni_init_v2';

function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getSampleMovements(): Movement[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const makeDate = (day: number) => new Date(y, m, day).toISOString();

  return [
    { id: makeId(), type: 'income', amount: 15000, category: 'sueldo', description: 'Sueldo del mes', date: makeDate(1), createdAt: makeDate(1) },
    { id: makeId(), type: 'income', amount: 3500, category: 'freelance', description: 'Proyecto diseño web', date: makeDate(5), createdAt: makeDate(5) },
    { id: makeId(), type: 'expense', amount: 1200, category: 'supermercado', description: 'Walmart semanal', date: makeDate(3), createdAt: makeDate(3) },
    { id: makeId(), type: 'expense', amount: 500, category: 'gasolina', description: 'Gasolina OXXO Gas', date: makeDate(4), createdAt: makeDate(4) },
    { id: makeId(), type: 'expense', amount: 380, category: 'restaurantes', description: 'Sushi con amigos', date: makeDate(6), createdAt: makeDate(6) },
    { id: makeId(), type: 'expense', amount: 180, category: 'entretenimiento', description: 'Netflix', date: makeDate(7), createdAt: makeDate(7) },
    { id: makeId(), type: 'expense', amount: 250, category: 'farmacia', description: 'Medicamentos', date: makeDate(8), createdAt: makeDate(8) },
    { id: makeId(), type: 'expense', amount: 150, category: 'comida', description: 'Tacos del norte', date: makeDate(9), createdAt: makeDate(9) },
    { id: makeId(), type: 'expense', amount: 650, category: 'supermercado', description: 'Chedraui', date: makeDate(10), createdAt: makeDate(10) },
    { id: makeId(), type: 'expense', amount: 320, category: 'gasolina', description: 'Gasolina BP', date: makeDate(11), createdAt: makeDate(11) },
  ];
}

const MovementsContext = createContext<MovementsContextType | null>(null);

export function MovementsProvider({ children }: { children: React.ReactNode }) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const initialized = await AsyncStorage.getItem(INIT_KEY);
        if (!initialized) {
          const sample = getSampleMovements();
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
          await AsyncStorage.setItem(INIT_KEY, 'true');
          setMovements(sample);
        } else {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) setMovements(JSON.parse(stored));
        }
      } catch {
        // ignore storage errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (data: Movement[]) => {
    setMovements(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addMovement = useCallback(
    async (movement: Omit<Movement, 'id' | 'createdAt'>) => {
      const next = [
        { ...movement, id: makeId(), createdAt: new Date().toISOString() },
        ...movements,
      ];
      await persist(next);
    },
    [movements, persist],
  );

  const updateMovement = useCallback(
    async (id: string, updates: Partial<Movement>) => {
      await persist(movements.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    },
    [movements, persist],
  );

  const deleteMovement = useCallback(
    async (id: string) => {
      await persist(movements.filter((m) => m.id !== id));
    },
    [movements, persist],
  );

  return (
    <MovementsContext.Provider value={{ movements, addMovement, updateMovement, deleteMovement, isLoading }}>
      {children}
    </MovementsContext.Provider>
  );
}

export function useMovements() {
  const ctx = useContext(MovementsContext);
  if (!ctx) throw new Error('useMovements must be used inside MovementsProvider');
  return ctx;
}
