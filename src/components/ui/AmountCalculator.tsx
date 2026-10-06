import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Switch, useWindowDimensions } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { applyIva, evaluateExpression, parseDecimalInput } from '@/src/core/utils/calculator';
import { formatCurrency } from '@/src/core/utils/format';
import { AppText, Font } from '@/src/components/ui/AppText';
import { MoneyDisplay } from '@/src/components/ui/MoneyDisplay';

interface AmountCalculatorProps {
  value: number;
  onChange: (amount: number) => void;
  currency?: string;
  showIva?: boolean;
  /** Visual tone for the hero amount */
  tone?: 'neutral' | 'income' | 'expense' | 'primary';
}

const KEYS = [
  ['C', '⌫', '%', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['.', '0', '00', '='],
] as const;

const COLS = 4;
const GAP = 8;
const SCREEN_PAD = 20;
const CARD_PAD = 14;

export function AmountCalculator({
  value,
  onChange,
  currency = 'MXN',
  showIva = true,
  tone = 'primary',
}: AmountCalculatorProps) {
  const { colors, radius, isDark } = useTheme();
  const { t } = useLanguage();
  const { width: screenW } = useWindowDimensions();
  const [expression, setExpression] = useState(value > 0 ? String(value) : '');
  const [includeIva, setIncludeIva] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const gridW = screenW - SCREEN_PAD * 2 - CARD_PAD * 2;
  const keyW = Math.floor((gridW - GAP * (COLS - 1)) / COLS);
  const keyH = Math.max(50, Math.min(64, keyW));

  const baseAmount = useMemo(() => {
    const evaluated = evaluateExpression(expression);
    if (evaluated !== null) return evaluated;
    const num = parseFloat(expression.replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : 0;
  }, [expression]);

  const breakdown = useMemo(() => applyIva(baseAmount, includeIva && showIva), [baseAmount, includeIva, showIva]);

  const emitChange = useCallback((amount: number) => {
    onChangeRef.current(amount);
  }, []);

  const updateExpression = useCallback(
    (next: string) => {
      setExpression(next);
      const evaluated = evaluateExpression(next);
      const base = evaluated ?? (parseFloat(next.replace(/[^0-9.]/g, '')) || 0);
      const total = showIva && includeIva ? applyIva(base, true).total : base;
      emitChange(total > 0 ? total : 0);
    },
    [emitChange, includeIva, showIva],
  );

  const pressKey = (key: string) => {
    if (key === 'C') {
      setExpression('');
      emitChange(0);
      return;
    }
    if (key === '⌫') {
      updateExpression(expression.slice(0, -1));
      return;
    }
    if (key === '=') {
      const result = evaluateExpression(expression);
      if (result !== null) {
        setExpression(String(result));
        emitChange(showIva && includeIva ? applyIva(result, true).total : result);
      }
      return;
    }
    if (key === '%') {
      const trimmed = expression.trim();
      updateExpression(/(\d+(?:\.\d+)?)\s*$/.test(trimmed) ? `${trimmed}%` : trimmed ? `${trimmed}%` : '0%');
      return;
    }
    if (['+', '-', '*', '/'].includes(key)) {
      if (!expression && key !== '-') return;
      updateExpression(/[+\-*/]$/.test(expression) ? expression.slice(0, -1) + key : expression + key);
      return;
    }
    if (key === '.') {
      const parts = expression.split(/[+\-*/]/);
      if ((parts[parts.length - 1] ?? '').includes('.')) return;
      updateExpression(expression ? `${expression}.` : '0.');
      return;
    }
    if (key === '00') {
      updateExpression(parseDecimalInput(expression + '00'));
      return;
    }
    if (/\d/.test(key)) {
      updateExpression(parseDecimalInput(expression + key));
    }
  };

  const handleIvaToggle = (v: boolean) => {
    setIncludeIva(v);
    emitChange(v && showIva ? applyIva(baseAmount, true).total : baseAmount);
  };

  const isOp = (k: string) => ['+', '-', '*', '/', '%', '='].includes(k);

  return (
    <View style={{ width: '100%', marginBottom: 16 }}>
      <AppText style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: Font.semibold, marginBottom: 10 }}>
        {t('common.amount')}
      </AppText>

      {/* Live hero amount — never clipped */}
      <MoneyDisplay
        amount={breakdown.total || 0}
        currency={currency}
        tone={tone}
        size="xl"
        label={expression && expression !== String(breakdown.total) ? expression : undefined}
        style={{ marginBottom: 12 }}
      />

      <View
        style={{
          width: '100%',
          backgroundColor: colors.card,
          borderRadius: radius,
          padding: CARD_PAD,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.28 : 0.06,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        {showIva ? (
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.fill,
              borderRadius: 16,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <AppText style={{ fontFamily: Font.semibold, fontSize: 15 }}>{t('common.addIva')}</AppText>
              {includeIva && baseAmount > 0 ? (
                <AppText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
                  {t('common.subtotalIva', {
                    subtotal: formatCurrency(breakdown.subtotal, currency),
                    iva: formatCurrency(breakdown.iva, currency),
                  })}
                </AppText>
              ) : null}
            </View>
            <Switch value={includeIva} onValueChange={handleIvaToggle} trackColor={{ true: colors.primary }} />
          </View>
        ) : null}

        <View style={{ width: gridW, alignSelf: 'center' }}>
          {KEYS.map((row, ri) => (
            <View
              key={ri}
              style={{
                flexDirection: 'row',
                width: gridW,
                marginBottom: ri < KEYS.length - 1 ? GAP : 0,
              }}
            >
              {row.map((key, ci) => (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.7}
                  onPress={() => pressKey(key)}
                  style={{
                    width: keyW,
                    height: keyH,
                    marginRight: ci < COLS - 1 ? GAP : 0,
                  }}
                >
                  <View
                    style={{
                      width: keyW,
                      height: keyH,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isOp(key) ? colors.accent : colors.fill,
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: keyH >= 56 ? 22 : 18,
                        fontFamily: Font.bold,
                        color: isOp(key) ? colors.primary : colors.foreground,
                        lineHeight: keyH >= 56 ? 26 : 22,
                      }}
                    >
                      {key}
                    </AppText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
