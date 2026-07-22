import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMovements } from '@/context/MovementsContext';
import { useProfile } from '@/context/ProfileContext';
import { useColors } from '@/hooks/useColors';
import { generateAIResponse } from '@/utils/aiAssistant';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const CHAT_KEY = '@moni_chat_v2';

function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getInitialMessage(name: string): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hola ${name}! Soy Moni.\n\nPregúntame sobre tus finanzas:\n• ¿Cuánto gasté este mes?\n• ¿Cuánto tengo disponible?\n• ¿Estoy ahorrando?`,
    timestamp: new Date().toISOString(),
  };
}

const SUGGESTIONS = [
  '¿Cuánto gasté?',
  '¿En qué gasto más?',
  '¿Estoy ahorrando?',
  '¿Cuánto tengo?',
];

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { movements } = useMovements();
  const { profile } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    AsyncStorage.getItem(CHAT_KEY).then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) { setMessages(parsed); return; }
      }
      const welcome = getInitialMessage(profile.name);
      setMessages([welcome]);
      AsyncStorage.setItem(CHAT_KEY, JSON.stringify([welcome]));
    });
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    inputRef.current?.focus();

    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: trimmed, timestamp: new Date().toISOString() };
    const currentMovements = movements;
    const currentProfile = profile;
    const nextMsgs = [userMsg, ...messages];
    setMessages(nextMsgs);
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));

    const reply = generateAIResponse(trimmed, currentMovements, currentProfile);
    const assistantMsg: ChatMessage = { id: makeId(), role: 'assistant', content: reply, timestamp: new Date().toISOString() };
    const finalMsgs = [assistantMsg, userMsg, ...messages];
    setMessages(finalMsgs);
    setIsTyping(false);
    await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(finalMsgs.slice(0, 60)));
  }, [input, messages, movements, profile]);

  const clearChat = async () => {
    const welcome = getInitialMessage(profile.name);
    setMessages([welcome]);
    await AsyncStorage.setItem(CHAT_KEY, JSON.stringify([welcome]));
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding">
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 20, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerName, { color: colors.foreground }]}>Moni</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>Asistente financiera</Text>
          </View>
        </View>
        <Pressable onPress={clearChat} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isUser = item.role === 'user';
          return (
            <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
              {!isUser && (
                <View style={[styles.moniDot, { backgroundColor: colors.primary }]} />
              )}
              <View
                style={[
                  styles.bubble,
                  isUser
                    ? [styles.bubbleUser, { backgroundColor: colors.foreground }]
                    : [styles.bubbleAssistant, { backgroundColor: colors.card, borderColor: colors.border }],
                ]}
              >
                <Text style={[styles.bubbleText, { color: isUser ? colors.background : colors.foreground }]}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
        inverted
        contentContainerStyle={styles.list}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          isTyping ? (
            <View style={styles.msgRow}>
              <View style={[styles.moniDot, { backgroundColor: colors.primary }]} />
              <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.bubbleText, { color: colors.mutedForeground }]}>Escribiendo…</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Suggestions (shown when empty input) */}
      {!input && messages.length <= 2 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              style={({ pressed }) => [
                styles.suggestion,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { backgroundColor: colors.muted },
              ]}
              onPress={() => send(s)}
            >
              <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputBar, { borderTopColor: colors.border, paddingBottom: botPad + 8, backgroundColor: colors.background }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
          placeholder="Pregúntame algo..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={300}
          returnKeyType="send"
          onSubmitEditing={() => send(input)}
          blurOnSubmit={false}
        />
        <Pressable
          style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.foreground : colors.muted }]}
          onPress={() => send(input)}
          disabled={!input.trim()}
        >
          <Ionicons name="arrow-up" size={18} color={input.trim() ? colors.background : colors.mutedForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerName: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  list: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 2 },
  msgRowUser: { justifyContent: 'flex-end' },
  moniDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6, flexShrink: 0 },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderBottomLeftRadius: 4, borderWidth: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 42,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
