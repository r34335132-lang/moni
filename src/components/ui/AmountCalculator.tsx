import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, useWindowDimensions } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { applyIva, evaluateExpression, parseDecimalInput } from '@/src/core/utils/calculator';
import { formatCurrency } from '@/src/core/utils/format';

interface AmountCalculatorProps {
  value: number;
  onChange: (amount: number) => void;
  currency?: string;
  showIva?: boolean;
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
const SCREEN_PAD = 16;
const CARD_PAD = 16;

/** Colores fijos — NativeWind borra estilos en Pressable */
const KEY_BG = '#F1F5F9';
const KEY_OP_BG = '#DCFCE7';
const KEY_BORDER = '#CBD5E1';
const KEY_OP_BORDER = '#86EFAC';
const KEY_TEXT = '#0F172A';
const KEY_OP_TEXT = '#16A34A';
const DISPLAY_BG = '#F1F5F9';
const CARD_BG = '#FFFFFF';
const CARD_BORDER = '#E2E8F0';

export function AmountCalculator({ value, onChange, currency = 'MXN', showIva = true }: AmountCalculatorProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { width: screenW } = useWindowDimensions();
  const [expression, setExpression] = useState(value > 0 ? String(value) : '');
  const [includeIva, setIncludeIva] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const gridW = screenW - SCREEN_PAD * 2 - CARD_PAD * 2;
  const keyW = Math.floor((gridW - GAP * (COLS - 1)) / COLS);
  const keyH = Math.max(54, Math.min(72, keyW));

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

  const updateExpression = useCallback((next: string) => {
    setExpression(next);
    const evaluated = evaluateExpression(next);
    const base = evaluated ?? (parseFloat(next.replace(/[^0-9.]/g, '')) || 0);
    const total = showIva && includeIva ? applyIva(base, true).total : base;
    emitChange(total > 0 ? total : 0);
  }, [emitChange, includeIva, showIva]);

  const pressKey = (key: string) => {
    if (key === 'C') { setExpression(''); emitChange(0); return; }
    if (key === '⌫') { updateExpression(expression.slice(0, -1)); return; }
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
    if (key === '00') { updateExpression(parseDecimalInput(expression + '00')); return; }
    if (/\d/.test(key)) { updateExpression(parseDecimalInput(expression + key)); }
  };

  const handleIvaToggle = (v: boolean) => {
    setIncludeIva(v);
    emitChange(v && showIva ? applyIva(baseAmount, true).total : baseAmount);
  };

  const isOp = (k: string) => ['+', '-', '*', '/', '%', '='].includes(k);

  return (
    <View style={{ width: '100%', marginBottom: 16 }}>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Monto</Text>

      <View
        style={{
          width: '100%',
          backgroundColor: CARD_BG,
          borderRadius: 16,
          padding: CARD_PAD,
          borderWidth: 1,
          borderColor: CARD_BORDER,
        }}
      >
        {/* Pantalla */}
        <View
          style={{
            width: gridW,
            alignSelf: 'center',
            backgroundColor: DISPLAY_BG,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginBottom: 14,
            minHeight: 100,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#64748B', fontSize: 17, textAlign: 'right', marginBottom: 6 }} numberOfLines={2}>
            {expression || '0'}
          </Text>
          <Text style={{ color: '#0F172A', fontSize: 40, fontWeight: '800', textAlign: 'right' }} adjustsFontSizeToFit numberOfLines={1}>
            {formatCurrency(breakdown.total || 0, currency)}
          </Text>
        </View>

        {showIva && (
          <View
            style={{
              width: gridW,
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: DISPLAY_BG,
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 15 }}>{t('common.addIva')}</Text>
              {includeIva && baseAmount > 0 ? (
                <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                  {t('common.subtotalIva', {
                    subtotal: formatCurrency(breakdown.subtotal, currency),
                    iva: formatCurrency(breakdown.iva, currency),
                  })}
                </Text>
              ) : null}
            </View>
            <Switch value={includeIva} onValueChange={handleIvaToggle} trackColor={{ true: '#22C55E' }} />
          </View>
        )}

        {/* Teclado — ancho fijo en px para llenar todo el card */}
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
                  activeOpacity={0.65}
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
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isOp(key) ? KEY_OP_BG : KEY_BG,
                      borderWidth: 1.5,
                      borderColor: isOp(key) ? KEY_OP_BORDER : KEY_BORDER,
                    }}
                  >
                    <Text style={{ fontSize: keyH >= 58 ? 26 : 22, fontWeight: '800', color: isOp(key) ? KEY_OP_TEXT : KEY_TEXT }}>
                      {key}
                    </Text>
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
