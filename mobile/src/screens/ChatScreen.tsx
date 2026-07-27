import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as api from '../api/endpoints';
import type { Message } from '../api/types';
import { getErrorMessage } from '../api/client';
import { AppIconMark } from '../components/brand/AppIconMark';
import { TutorAvatar } from '../components/brand/TutorAvatar';
import { Button } from '../components/Button';
import { ChatBubble } from '../components/ui/ChatBubble';
import { ChatInputBar } from '../components/ui/ChatInputBar';
import { CorrectionCard } from '../components/ui/CorrectionCard';
import { ErrorCard } from '../components/ui/ErrorCard';
import { SkeletonList } from '../components/ui/Shimmer';
import { SuggestionChips } from '../components/ui/PromptChip';
import { TypingIndicator } from '../components/ui/TypingIndicator';
import { VocabChip } from '../components/ui/PremiumEmptyState';
import { SUGGESTED_PROMPTS } from '../constants/chatPrompts';
import { LAST_PRACTICE_KEY, PENDING_CHAT_PROMPT_KEY } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

function extractVocabWords(correction: Message['correction']): string[] {
  if (!correction) return [];
  const words = correction.corrected.split(/\s+/).filter(w => w.length > 3);
  return [...new Set(words)].slice(0, 4);
}

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId, title, guided } = route.params;
  const { settings } = useAuth();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const listRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [guidedDone, setGuidedDone] = useState(false);
  const [vocabModal, setVocabModal] = useState<{ word: string; translation?: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await api.fetchMessages(conversationId);
      setMessages(list);
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const pending = await AsyncStorage.getItem(PENDING_CHAT_PROMPT_KEY);
      if (pending && !loading && messages.length === 0) {
        await AsyncStorage.removeItem(PENDING_CHAT_PROMPT_KEY);
        setInput(pending);
        void onSend(pending);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, messages.length]);

  async function onSend(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setError('');
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content: text,
      correction: null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const result = await api.sendChatMessage(conversationId, text);
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== optimistic.id);
        return [...withoutTemp, result.userMessage, result.assistantMessage];
      });
      await AsyncStorage.setItem(LAST_PRACTICE_KEY, new Date().toDateString());
      if (guided && !guidedDone) {
        setCelebrate(true);
        setGuidedDone(true);
      }
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      if (!textOverride) setInput(text);
      setError(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  }

  async function saveCorrection(message: Message, phrase?: string) {
    if (!message.correction) return;
    setSavingId(message.id);
    try {
      await api.createVocabularyItem({
        phrase: phrase ?? message.correction.corrected,
        note: message.correction.explanation,
        sourceMessageId: message.id,
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSavingId(null);
    }
  }

  const sidePad = horizontalPadding;
  const langCode = settings?.targetLanguage ?? 'es';

  return (
    <View className="flex-1" style={{ backgroundColor: colors.lavenderSoft }}>
      <View
        className="flex-row items-center border-b border-border/40 bg-surface/95 px-4 py-3"
        style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-mist">
          <Text className="text-xl font-bold text-ink">←</Text>
        </Pressable>
        <TutorAvatar size="sm" />
        <View className="ml-3 flex-1">
          <Text className="text-lg font-extrabold text-ink" numberOfLines={1}>
            {title ?? 'Practice'}
          </Text>
          <Text className="text-xs font-medium text-ink-muted">
            FluentAI Tutor · gentle corrections
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {loading ? (
          <View className="flex-1 px-4 pt-4" style={{ paddingHorizontal: sidePad }}>
            <SkeletonList count={5} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: sidePad,
              paddingTop: 16,
              paddingBottom: 8,
              maxWidth: contentMaxWidth,
              alignSelf: 'center',
              width: '100%',
              flexGrow: messages.length === 0 ? 1 : undefined,
            }}
            data={messages}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              messages.length > 0 && listRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item, index }) => {
              const prev = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prev || prev.role !== item.role;
              const vocabWords = item.correction ? extractVocabWords(item.correction) : [];
              return (
                <View className="mb-2">
                  <ChatBubble message={item} showAvatar={showAvatar} />
                  {item.role === 'user' && item.correction ? (
                    <View className="self-end max-w-[92%]">
                      {vocabWords.length > 0 ? (
                        <View className="mb-2 mt-1 flex-row flex-wrap">
                          {vocabWords.map(w => (
                            <VocabChip
                              key={w}
                              phrase={w}
                              onPress={() => setVocabModal({ word: w, translation: item.correction?.corrected })}
                            />
                          ))}
                        </View>
                      ) : null}
                      <CorrectionCard
                        correction={item.correction}
                        onSave={() => saveCorrection(item)}
                        onPractice={() => onSend(item.correction!.original)}
                        saving={savingId === item.id}
                      />
                    </View>
                  ) : null}
                </View>
              );
            }}
            ListEmptyComponent={
              <View className="flex-1 justify-center py-8">
                <View className="items-center">
                  <TutorAvatar size="lg" />
                  <Text className="mt-6 text-center text-2xl font-extrabold text-ink">
                    Hi! I'm your FluentAI tutor
                  </Text>
                  <Text className="mt-3 max-w-sm text-center text-base leading-6 text-ink-muted">
                    Practice conversations in your target language. I'll gently correct your grammar
                    and help you learn new phrases.
                  </Text>
                </View>
                <Text className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-ink-faint">
                  Try a prompt
                </Text>
                <SuggestionChips
                  prompts={SUGGESTED_PROMPTS}
                  onSelect={prompt => {
                    setInput(prompt);
                    void onSend(prompt);
                  }}
                />
              </View>
            }
            ListFooterComponent={
              sending ? (
                <View className="mb-4 self-start">
                  <TypingIndicator />
                </View>
              ) : null
            }
          />
        )}

        {error ? (
          <View style={{ paddingHorizontal: sidePad }}>
            <ErrorCard message={error} onRetry={() => (input.trim() ? onSend() : load())} />
          </View>
        ) : null}

        <ChatInputBar
          value={input}
          onChangeText={setInput}
          onSend={() => onSend()}
          sending={sending}
          languageCode={langCode}
          maxWidth={contentMaxWidth}
          horizontalPad={sidePad}
        />
      </KeyboardAvoidingView>

      <Modal visible={Boolean(vocabModal)} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-ink/40 px-8"
          onPress={() => setVocabModal(null)}>
          <Pressable className="w-full max-w-sm rounded-3xl bg-surface p-6" onPress={e => e.stopPropagation()}>
            <Text className="text-xs font-bold uppercase text-ink-faint">Vocabulary</Text>
            <Text className="mt-2 text-2xl font-extrabold text-brand">{vocabModal?.word}</Text>
            {vocabModal?.translation ? (
              <Text className="mt-2 text-base text-ink-muted">{vocabModal.translation}</Text>
            ) : null}
            <View className="mt-6 flex-row gap-2">
              <Button
                title="Save word"
                variant="lavender"
                className="flex-1"
                onPress={() => {
                  const msg = messages.find(m => m.correction);
                  if (msg?.correction && vocabModal) {
                    void saveCorrection(msg, vocabModal.word);
                  }
                  setVocabModal(null);
                }}
              />
              <Button title="Close" variant="outline" className="flex-1" onPress={() => setVocabModal(null)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={celebrate} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-ink/40 px-8">
          <View className="w-full max-w-sm rounded-3xl bg-surface p-6">
            <View className="items-center">
              <AppIconMark size={64} />
            </View>
            <Text className="mt-4 text-center text-2xl font-extrabold text-ink">Nice work!</Text>
            <Text className="mt-2 text-center text-base leading-6 text-ink-muted">
              You completed your first FluentAI practice. Keep the streak going!
            </Text>
            <Button
              title="Continue"
              className="mt-6"
              onPress={() => {
                setCelebrate(false);
                navigation.goBack();
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
