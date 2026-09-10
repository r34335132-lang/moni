import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppLocale } from '@/src/core/i18n/types';
import { getNested, translations } from '@/src/core/i18n/translations';
import { setFormatLocale } from '@/src/core/utils/format';

const STORAGE_KEY = '@moni/locale';

interface LanguageContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name];
    return value !== undefined && value !== null ? String(value) : `{{${name}}}`;
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('es');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (stored === 'es' || stored === 'en')) {
          setLocaleState(stored);
          setFormatLocale(stored);
        } else {
          setFormatLocale('es');
        }
      } catch {
        setFormatLocale('es');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    setFormatLocale(locale);
  }, [locale, ready]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    setFormatLocale(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const fromLocale = getNested(translations[locale], key);
      const fallback = locale === 'es' ? undefined : getNested(translations.es, key);
      const template = fromLocale ?? fallback ?? key;
      return interpolate(template, params);
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
