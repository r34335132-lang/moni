import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimarySaveButton } from '@/src/components/ui/PrimarySaveButton';
import { useTheme } from '@/src/hooks/useTheme';
import { useLanguage } from '@/src/providers/LanguageProvider';

const HIGH_SCORE_KEY = '@moni_pixel_high_score';
const GAME_SECONDS = 10;

/** Minijuego pixel: toca el cuadrado verde antes de que desaparezca */
export default function MinigameScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [target, setTarget] = useState({ x: 40, y: 40 });
  const pulse = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then((v) => {
      if (v) setHighScore(parseInt(v, 10) || 0);
    });
  }, []);

  const randomTarget = () => {
    setTarget({ x: 20 + Math.random() * 220, y: 20 + Math.random() * 280 });
  };

  const endGame = useCallback(async (finalScore: number) => {
    setPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      await AsyncStorage.setItem(HIGH_SCORE_KEY, String(finalScore));
    }
  }, [highScore]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setPlaying(true);
    randomTarget();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((tm) => {
        if (tm <= 1) {
          endGame(score);
          return 0;
        }
        return tm - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (playing && timeLeft === 0) endGame(score);
  }, [playing, timeLeft, score, endGame]);

  const onHit = () => {
    if (!playing) return;
    setScore((s) => s + 1);
    randomTarget();
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.2, duration: 80, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScreenHeader title={t('minigame.title')} showBack subtitle={t('minigame.subtitle')} />
      <ScreenContainer contentContainerStyle={{ backgroundColor: '#0F172A' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ backgroundColor: '#1E293B', padding: 12, borderRadius: 8, minWidth: 90, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>{t('minigame.points')}</Text>
            <Text style={{ color: '#22C55E', fontSize: 24, fontWeight: '800', fontFamily: 'monospace' }}>{score}</Text>
          </View>
          <View style={{ backgroundColor: '#1E293B', padding: 12, borderRadius: 8, minWidth: 90, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>{t('minigame.time')}</Text>
            <Text style={{ color: '#FBBF24', fontSize: 24, fontWeight: '800', fontFamily: 'monospace' }}>{playing ? timeLeft : GAME_SECONDS}</Text>
          </View>
          <View style={{ backgroundColor: '#1E293B', padding: 12, borderRadius: 8, minWidth: 90, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>{t('minigame.record')}</Text>
            <Text style={{ color: '#F472B6', fontSize: 24, fontWeight: '800', fontFamily: 'monospace' }}>{highScore}</Text>
          </View>
        </View>

        <View
          style={{
            height: 340,
            backgroundColor: '#1E293B',
            borderRadius: 4,
            borderWidth: 4,
            borderColor: '#334155',
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          {playing ? (
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Pressable
                onPress={onHit}
                style={{
                  position: 'absolute',
                  left: target.x,
                  top: target.y,
                  width: 48,
                  height: 48,
                  backgroundColor: '#22C55E',
                  borderWidth: 4,
                  borderColor: '#16A34A',
                }}
              />
            </Animated.View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <Text style={{ color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 8 }}>
                {t('minigame.instructions', { seconds: GAME_SECONDS })}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 12, textAlign: 'center' }}>
                {t('minigame.comeBack')}
              </Text>
            </View>
          )}
        </View>

        <PrimarySaveButton
          title={playing ? t('minigame.playing') : t('minigame.play')}
          icon="game-controller"
          onPress={startGame}
          disabled={playing}
        />
      </ScreenContainer>
    </View>
  );
}
