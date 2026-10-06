import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { GlassIconBadge } from '@/src/components/ui/Glass';

interface FabMenuProps {
  onManual: () => void;
  onVoice: () => void;
  onPhoto: () => void;
}

const ACTION_META = [
  { key: 'manual' as const, icon: 'create-outline' as const, color: '#0EA5E9', labelKey: 'fab.manual' },
  { key: 'voice' as const, icon: 'mic' as const, color: '#A855F7', labelKey: 'fab.voice' },
  { key: 'photo' as const, icon: 'receipt-outline' as const, color: '#F59E0B', labelKey: 'fab.photo' },
] as const;

const FAB_SIZE = 58;
const FAB_WIDTH = 120;
const STORAGE_KEY = '@moni/fab-position-v3';
const SNAP = { duration: 180, easing: Easing.out(Easing.cubic) };
const SPRING = { damping: 24, stiffness: 280, mass: 0.8 };

type Pos = { x: number; y: number };

export function FabMenu({ onManual, onVoice, onPhoto }: FabMenuProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [menuAbove, setMenuAbove] = useState(true);
  const ignorePressRef = useRef(false);

  const progress = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const bounds = useMemo(() => {
    const minX = 12;
    const maxX = Math.max(minX, winW - FAB_WIDTH - 12);
    const minY = insets.top + 12;
    const maxY = Math.max(minY, winH - FAB_SIZE - Math.max(insets.bottom, 16) - 70);
    return { minX, maxX, minY, maxY };
  }, [winW, winH, insets.top, insets.bottom]);

  const defaultPos = useCallback((): Pos => ({ x: bounds.maxX, y: bounds.maxY }), [bounds.maxX, bounds.maxY]);

  const clampAndSnap = useCallback((x: number, y: number): Pos => {
    const cy = Math.min(bounds.maxY, Math.max(bounds.minY, y));
    const mid = winW / 2;
    const cx = x + FAB_WIDTH / 2 < mid ? bounds.minX : bounds.maxX;
    return { x: cx, y: cy };
  }, [bounds, winW]);

  const persist = useCallback((pos: Pos) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pos)).catch(() => undefined);
  }, []);

  const applyPos = useCallback((pos: Pos, animate: boolean) => {
    const next = clampAndSnap(pos.x, pos.y);
    if (animate) {
      translateX.value = withSpring(next.x, SPRING);
      translateY.value = withSpring(next.y, SPRING);
    } else {
      translateX.value = next.x;
      translateY.value = next.y;
    }
    setMenuAbove(next.y > bounds.minY + 200);
    return next;
  }, [bounds.minY, clampAndSnap, translateX, translateY]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const fallback = defaultPos();
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as Pos) : null;
        if (!alive) return;
        applyPos(parsed ?? fallback, false);
      } catch {
        if (!alive) return;
        applyPos(fallback, false);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [applyPos, defaultPos]);

  useEffect(() => {
    if (!ready) return;
    applyPos({ x: translateX.value, y: translateY.value }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winW, winH, ready]);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, SNAP);
  }, [open, progress]);

  const toggleOpen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setOpen((v) => !v);
  }, []);

  const onPressFab = useCallback(() => {
    if (ignorePressRef.current) {
      ignorePressRef.current = false;
      return;
    }
    toggleOpen();
  }, [toggleOpen]);

  const finishDrag = useCallback((x: number, y: number) => {
    ignorePressRef.current = true;
    const next = applyPos({ x, y }, true);
    persist(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, [applyPos, persist]);

  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .activeOffsetY([-14, 14])
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (open) runOnJS(setOpen)(false);
      translateX.value = Math.min(bounds.maxX, Math.max(bounds.minX, startX.value + e.translationX));
      translateY.value = Math.min(bounds.maxY, Math.max(bounds.minY, startY.value + e.translationY));
    })
    .onEnd(() => {
      runOnJS(finishDrag)(translateX.value, translateY.value);
    });

  const handlers = { manual: onManual, voice: onVoice, photo: onPhoto } as const;

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  const renderFab = (animatedRotate: boolean) => (
    <Pressable onPress={onPressFab} accessibilityRole="button" accessibilityLabel={t('fab.add')}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            height: FAB_SIZE,
            width: open ? FAB_SIZE : FAB_WIDTH,
            borderRadius: FAB_SIZE / 2,
            overflow: 'hidden',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(255,255,255,0.35)',
          },
          animatedRotate ? fabIconStyle : null,
        ]}
      >
        <LinearGradient
          colors={['#34D399', '#2DBE5A', '#248A3D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name={open ? 'close' : 'add'} size={26} color="#FFFFFF" />
        {!open ? (
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
            {t('fab.add')}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );

  if (!ready) {
    return (
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 72 + insets.bottom,
          zIndex: 300,
          elevation: 30,
        }}
      >
        {renderFab(false)}
      </View>
    );
  }

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex: 300 }]}>
      {open ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
          accessibilityLabel={t('common.cancel')}
        />
      ) : null}

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              width: FAB_WIDTH,
              height: FAB_SIZE,
              zIndex: 2,
            },
            shellStyle,
          ]}
        >
          {open ? (
            <View
              style={{
                position: 'absolute',
                right: 0,
                width: 190,
                ...(menuAbove ? { bottom: FAB_SIZE + 12 } : { top: FAB_SIZE + 12 }),
                alignItems: 'flex-end',
              }}
            >
              {ACTION_META.map((a, index) => (
                <Animated.View
                  key={a.key}
                  entering={FadeInDown.delay(30 * index).duration(160)}
                  exiting={FadeOut.duration(90)}
                  style={{ marginBottom: menuAbove ? 8 : 0, marginTop: menuAbove ? 0 : 8 }}
                >
                  <Pressable
                    onPress={() => {
                      setOpen(false);
                      handlers[a.key]();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t(a.labelKey)}
                    style={{
                      borderRadius: 18,
                      overflow: 'hidden',
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
                      backgroundColor: isDark ? 'rgba(28,28,30,0.98)' : 'rgba(255,255,255,0.98)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}>
                      <Text style={{ color: colors.foreground, fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                        {t(a.labelKey)}
                      </Text>
                      <GlassIconBadge color={a.color} size={36}>
                        <Ionicons name={a.icon} size={18} color={a.color} />
                      </GlassIconBadge>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}

          <View style={{ alignSelf: 'flex-end' }}>{renderFab(true)}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
