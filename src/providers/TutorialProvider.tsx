import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { useTheme } from '@/src/hooks/useTheme';
import { AppText, Font } from '@/src/components/ui/AppText';
import { PressableScale } from '@/src/components/ui/Glass';

const STORAGE_PREFIX = 'moni.tutorial.v1:';
const TAB_BAR_HEIGHT = 56;
const HOLE_PADDING = 6;

type Rect = { x: number; y: number; width: number; height: number };

type Step = { key: string; target?: string };

const STEPS: Step[] = [
  { key: 'welcome' },
  { key: 'accounts', target: 'accounts' },
  { key: 'balance', target: 'balance' },
  { key: 'reminders', target: 'reminders' },
  { key: 'profile', target: 'profile' },
  { key: 'add', target: 'dock-add' },
  { key: 'search', target: 'dock-search' },
  { key: 'voice', target: 'dock-voice' },
  { key: 'tabs', target: 'tabbar' },
  { key: 'finish' },
];

interface TutorialContextValue {
  register: (id: string, node: View) => void;
  unregister: (id: string, node: View) => void;
  /** Called by the home screen once its content is on screen. */
  startIfNeeded: () => void;
  /** Cancels a pending start (home lost focus before the delay elapsed). */
  cancelPending: () => void;
  /** Replays the tutorial from Profile. */
  replay: () => void;
  active: boolean;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const targets = useRef(new Map<string, View>());
  const [active, setActive] = useState(false);
  const [replayRequested, setReplayRequested] = useState(false);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const register = useCallback((id: string, node: View) => {
    targets.current.set(id, node);
  }, []);

  const unregister = useCallback((id: string, node: View) => {
    if (targets.current.get(id) === node) targets.current.delete(id);
  }, []);

  const storageKey = user ? `${STORAGE_PREFIX}${user.id}` : null;

  const startIfNeeded = useCallback(() => {
    if (!storageKey || active) return;
    if (startTimer.current) clearTimeout(startTimer.current);
    const forced = replayRequested;
    // Let the dashboard enter animations settle so measurements are final.
    startTimer.current = setTimeout(async () => {
      if (!forced) {
        const done = await AsyncStorage.getItem(storageKey).catch(() => '1');
        if (done) return;
      }
      setReplayRequested(false);
      setActive(true);
    }, 900);
  }, [storageKey, active, replayRequested]);

  const cancelPending = useCallback(() => {
    if (startTimer.current) clearTimeout(startTimer.current);
    startTimer.current = null;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const finish = useCallback(() => {
    setActive(false);
    if (storageKey) AsyncStorage.setItem(storageKey, '1').catch(() => undefined);
  }, [storageKey]);

  const replay = useCallback(() => {
    setReplayRequested(true);
    router.navigate('/(tabs)');
  }, []);

  const value = useMemo(
    () => ({ register, unregister, startIfNeeded, cancelPending, replay, active }),
    [register, unregister, startIfNeeded, cancelPending, replay, active],
  );

  return (
    <TutorialContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {active ? <TutorialOverlay targets={targets.current} bottomInset={insets.bottom} onFinish={finish} /> : null}
      </View>
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
  return ctx;
}

/** Wrap a button so the tutorial can spotlight it. */
export function TutorialTarget({
  id,
  children,
  style,
}: {
  id: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { register, unregister } = useTutorial();
  const ref = useRef<View>(null);
  // Only the focused screen owns the id (the dock is mounted on several tab screens).
  useFocusEffect(
    useCallback(() => {
      const node = ref.current;
      if (node) register(id, node);
      return () => {
        if (node) unregister(id, node);
      };
    }, [id, register, unregister]),
  );
  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}

function measure(node: View): Promise<Rect | null> {
  return new Promise((resolve) => {
    node.measureInWindow((x, y, width, height) => {
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  });
}

function TutorialOverlay({
  targets,
  bottomInset,
  onFinish,
}: {
  targets: Map<string, View>;
  bottomInset: number;
  onFinish: () => void;
}) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const containerRef = useRef<View>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState<Rect | null>(null);

  const hx = useSharedValue(0);
  const hy = useSharedValue(0);
  const hw = useSharedValue(0);
  const hh = useSharedValue(0);
  const pulse = useSharedValue(0);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })),
      -1,
    );
  }, [pulse]);

  useEffect(() => {
    if (!size.width) return;
    let cancelled = false;

    const resolveRect = async (): Promise<Rect | null> => {
      if (!step.target) return null;
      if (step.target === 'tabbar') {
        const h = TAB_BAR_HEIGHT + bottomInset;
        return { x: 0, y: size.height - h, width: size.width, height: h };
      }
      const node = targets.get(step.target);
      const container = containerRef.current;
      if (!node || !container) return null;
      const [r, origin] = await Promise.all([measure(node), measure(container).then((o) => o ?? { x: 0, y: 0 })]);
      if (!r) return null;
      return { x: r.x - origin.x, y: r.y - origin.y, width: r.width, height: r.height };
    };

    resolveRect().then((r) => {
      if (cancelled) return;
      if (step.target && !r) {
        // Target not on screen (e.g. layout changed) — skip it instead of pointing at nothing.
        setIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
        return;
      }
      const target = r
        ? {
            x: r.x - HOLE_PADDING,
            y: r.y - HOLE_PADDING,
            width: r.width + HOLE_PADDING * 2,
            height: r.height + HOLE_PADDING * 2,
          }
        : { x: size.width / 2, y: size.height / 2, width: 0, height: 0 };
      const timing = { duration: 340, easing: Easing.out(Easing.cubic) };
      hx.value = withTiming(target.x, timing);
      hy.value = withTiming(target.y, timing);
      hw.value = withTiming(target.width, timing);
      hh.value = withTiming(target.height, timing);
      setHole(r ? target : null);
    });

    return () => {
      cancelled = true;
    };
  }, [index, size, step.target, targets, bottomInset, hx, hy, hw, hh]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index > 0) setIndex(index - 1);
      else onFinish();
      return true;
    });
    return () => sub.remove();
  }, [index, onFinish]);

  const W = size.width;
  const H = size.height;

  const pathProps = useAnimatedProps(() => {
    const x = hx.value;
    const y = hy.value;
    const w = hw.value;
    const h = hh.value;
    const r = Math.min(h / 2, w / 2, 26);
    const hole =
      w <= 0 || h <= 0
        ? ''
        : `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
    return { d: `M0 0H${W}V${H}H0Z${hole}` };
  });

  const ringStyle = useAnimatedStyle(() => {
    const grow = 10 * pulse.value;
    const r = Math.min(hh.value / 2, hw.value / 2, 26);
    return {
      left: hx.value - grow / 2,
      top: hy.value - grow / 2,
      width: hw.value + grow,
      height: hh.value + grow,
      borderRadius: r + grow / 2,
      opacity: hw.value > 0 ? 0.9 * (1 - pulse.value) : 0,
    };
  });

  const next = () => {
    Haptics.selectionAsync().catch(() => undefined);
    if (isLast) onFinish();
    else setIndex(index + 1);
  };

  const back = () => {
    Haptics.selectionAsync().catch(() => undefined);
    if (index > 0) setIndex(index - 1);
  };

  const holeCenterY = hole ? hole.y + hole.height / 2 : H / 2;
  const cardBelow = hole ? holeCenterY < H / 2 : false;
  const cardPosition = !hole
    ? { top: 0, bottom: 0, justifyContent: 'center' as const }
    : cardBelow
      ? { top: hole.y + hole.height + 14 }
      : { bottom: H - hole.y + 14 };

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(180)}
      style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}
    >
      <View ref={containerRef} onLayout={onLayout} collapsable={false} style={StyleSheet.absoluteFill} />
      {W > 0 ? (
        <>
          <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
            <AnimatedPath animatedProps={pathProps} fill={isDark ? 'rgba(0,0,0,0.78)' : 'rgba(10,12,14,0.72)'} fillRule="evenodd" />
          </Svg>
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', borderWidth: 2, borderColor: colors.primary }, ringStyle]}
          />
        </>
      ) : null}

      {/* Swallow taps so the app underneath can't be used mid-tutorial. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={next} accessibilityLabel={t('tutorial.next')} />

      <View pointerEvents="box-none" style={[{ position: 'absolute', left: 18, right: 18 }, cardPosition]}>
        <Animated.View
          key={step.key}
          entering={(cardBelow ? FadeInDown : FadeInUp).duration(260)}
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 18,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {STEPS.map((s, i) => (
                <View
                  key={s.key}
                  style={{
                    width: i === index ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === index ? colors.primary : colors.fill,
                  }}
                />
              ))}
            </View>
            <AppText style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: Font.medium }}>
              {t('tutorial.progress', { current: index + 1, total: STEPS.length })}
            </AppText>
          </View>

          <AppText style={{ fontFamily: Font.bold, fontSize: 19, letterSpacing: -0.3, marginBottom: 6 }}>
            {t(`tutorial.${step.key}Title`)}
          </AppText>
          <AppText style={{ color: colors.mutedForeground, fontSize: 15, lineHeight: 21 }}>
            {t(`tutorial.${step.key}Body`)}
          </AppText>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 }}>
            {!isLast ? (
              <Pressable onPress={onFinish} hitSlop={10} style={{ paddingVertical: 8, paddingRight: 8 }}>
                <AppText style={{ color: colors.mutedForeground, fontFamily: Font.semibold, fontSize: 14 }}>
                  {t('tutorial.skip')}
                </AppText>
              </Pressable>
            ) : null}
            <View style={{ flex: 1 }} />
            {index > 0 ? (
              <PressableScale
                onPress={back}
                haptic={false}
                style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: 980, backgroundColor: colors.fill }}
              >
                <AppText style={{ fontFamily: Font.semibold, fontSize: 14 }}>{t('tutorial.back')}</AppText>
              </PressableScale>
            ) : null}
            <PressableScale
              onPress={next}
              haptic={false}
              style={{ paddingHorizontal: 20, paddingVertical: 11, borderRadius: 980, backgroundColor: colors.primary }}
            >
              <AppText style={{ color: colors.primaryForeground, fontFamily: Font.bold, fontSize: 14 }}>
                {isLast ? t('tutorial.done') : t('tutorial.next')}
              </AppText>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
