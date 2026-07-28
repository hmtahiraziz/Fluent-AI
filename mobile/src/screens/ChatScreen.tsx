import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
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
import { ChatBubble, ChatDatePill } from '../components/ui/ChatBubble';
import { ChatInputBar } from '../components/ui/ChatInputBar';
import { CorrectionCard } from '../components/ui/CorrectionCard';
import { ErrorCard } from '../components/ui/ErrorCard';
import { SkeletonList } from '../components/ui/Shimmer';
import { SuggestionChips } from '../components/ui/PromptChip';
import { StreakBadge } from '../components/ui/StreakBadge';
import { TypingIndicator } from '../components/ui/TypingIndicator';
import {
  getQuickReplies,
  getSuggestedPrompts,
  LanguageMismatchBanner,
  LanguagePairPill,
  useLanguagePair,
} from '../features/chat';
import { useAuth } from '../context/AuthContext';
import { PENDING_CHAT_PROMPT_KEY } from '../config/constants';
import { formatStreakLabel, getStreakDisplay, recordPracticeDay } from '../services/streakStorage';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import type { RootStackParamList } from '../navigation/types';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

import type { LanguagePairInfo } from '../features/chat';

function ChatHeader({
  onBack,
  streakLabel,
  horizontalPad,
  topInset,
  compact,
  languagePair,
}: {
  onBack: () => void;
  streakLabel: string;
  horizontalPad: number;
  topInset: number;
  compact: boolean;
  languagePair: LanguagePairInfo;
}) {
  return (
    <View
      className="bg-canvas"
      style={{
        paddingTop: topInset + 8,
        paddingBottom: 8,
        paddingHorizontal: horizontalPad,
      }}>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-2 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surfaceContainer }}>
          <Text className="text-xl font-bold text-brand">←</Text>
        </Pressable>

        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View
            className="overflow-hidden rounded-full border"
            style={{ borderColor: colors.border }}>
            <TutorAvatar size="sm" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-2xl font-bold text-brand" numberOfLines={1}>
              AI Tutor
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1">
              <View className="h-2 w-2 rounded-full bg-success" />
              <Text className="text-xs font-medium text-ink-muted">Online</Text>
            </View>
          </View>
        </View>

        <View className="ml-2 flex-row items-center gap-2">
          {!compact ? (
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.surfaceContainer }}>
              <Text className="text-base text-brand">🔍</Text>
            </Pressable>
          ) : null}
          <StreakBadge label={streakLabel} compact />
        </View>
      </View>
      <LanguagePairPill
        native={languagePair.native}
        target={languagePair.target}
        level={languagePair.level}
        compact
        style={{ marginTop: 10, alignSelf: 'flex-start' }}
      />
    </View>
  );
}

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId, guided, language: routeLanguage } = route.params;
  const insets = useSafeAreaInsets();
  const { settings } = useAuth();
  const languagePair = useLanguagePair();
  const { contentMaxWidth, horizontalPadding, isCompact } = useResponsive();
  const listRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [guidedDone, setGuidedDone] = useState(false);
  const [streakLabel, setStreakLabel] = useState('Start today');
  const [vocabModal, setVocabModal] = useState<{ word: string; translation?: string } | null>(
    null,
  );

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const onKeyboardShow = useCallback(() => {
    setTimeout(() => scrollToBottom(true), 80);
  }, [scrollToBottom]);

  const keyboardHeight = useKeyboardInset(onKeyboardShow);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setError('');
    setInput('');
  }, [conversationId]);

  useEffect(() => {
    void getStreakDisplay().then(setStreakLabel);
  }, []);

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
      const raw = await AsyncStorage.getItem(PENDING_CHAT_PROMPT_KEY);
      if (!raw || loading || messages.length > 0) return;

      let pendingConversationId = conversationId;
      let prompt = raw;
      try {
        const parsed = JSON.parse(raw) as { conversationId?: string; prompt?: string };
        if (parsed.conversationId && parsed.prompt) {
          pendingConversationId = parsed.conversationId;
          prompt = parsed.prompt;
        }
      } catch {
        /* legacy string-only prompt */
      }

      if (pendingConversationId !== conversationId || !prompt.trim()) return;

      await AsyncStorage.removeItem(PENDING_CHAT_PROMPT_KEY);
      setInput(prompt);
      void onSend(prompt);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, loading, messages.length]);

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
    scrollToBottom(true);
    try {
      const result = await api.sendChatMessage(conversationId, text);
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== optimistic.id);
        return [...withoutTemp, result.userMessage, result.assistantMessage];
      });
      const count = await recordPracticeDay();
      setStreakLabel(formatStreakLabel(count));
      if (guided && !guidedDone) {
        setCelebrate(true);
        setGuidedDone(true);
      }
      scrollToBottom(true);
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
  const keyboardVisible = keyboardHeight > 0;
  const chatLanguage = routeLanguage ?? languagePair.targetCode;
  const suggestedPrompts = getSuggestedPrompts(chatLanguage);
  const quickReplies = getQuickReplies(chatLanguage);
  const languageMismatch =
    Boolean(routeLanguage) &&
    Boolean(settings?.targetLanguage) &&
    routeLanguage !== settings?.targetLanguage;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.canvas }}>
      <ChatHeader
        onBack={() => navigation.goBack()}
        streakLabel={streakLabel}
        horizontalPad={sidePad}
        topInset={insets.top}
        compact={isCompact}
        languagePair={languagePair}
      />

      {languageMismatch && routeLanguage && settings?.targetLanguage ? (
        <LanguageMismatchBanner
          conversationLanguage={routeLanguage}
          currentTargetLanguage={settings.targetLanguage}
        />
      ) : null}

      <View
        className="flex-1"
        style={{ paddingBottom: Platform.OS === 'ios' ? keyboardHeight : 0 }}>
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
              paddingBottom: 16,
              maxWidth: contentMaxWidth,
              alignSelf: 'center',
              width: '100%',
              flexGrow: messages.length === 0 ? 1 : undefined,
            }}
            data={messages}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => {
              if (messages.length > 0) scrollToBottom(false);
            }}
            renderItem={({ item }) => (
              <View className="mb-6">
                <ChatBubble message={item} />
                {item.role === 'user' && item.correction ? (
                  <CorrectionCard
                    correction={item.correction}
                    onSave={() => saveCorrection(item)}
                    onPractice={() => onSend(item.correction!.original)}
                    saving={savingId === item.id}
                  />
                ) : null}
              </View>
            )}
            ListHeaderComponent={
              messages.length > 0 ? <ChatDatePill label="Today" /> : null
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center py-8">
                <View className="items-center">
                  <TutorAvatar size="lg" />
                  <Text className="mt-6 text-center text-2xl font-extrabold text-ink">
                    Hi! I'm your FluentAI tutor
                  </Text>
                  <Text className="mt-3 max-w-sm text-center text-base leading-6 text-ink-muted">
                    Practice {languagePair.target.label} at {languagePair.level} level. I'll gently
                    correct your grammar and help you learn new phrases.
                  </Text>
                </View>
                <Text className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-ink-faint">
                  Try a prompt
                </Text>
                <SuggestionChips
                  prompts={suggestedPrompts}
                  limit={4}
                  onSelect={prompt => {
                    setInput(prompt);
                    void onSend(prompt);
                  }}
                />
              </View>
            }
            ListFooterComponent={sending ? <TypingIndicator /> : null}
          />
        )}

        {error ? (
          <View style={{ paddingHorizontal: sidePad, paddingBottom: 8 }}>
            <ErrorCard message={error} onRetry={() => (input.trim() ? onSend() : load())} />
          </View>
        ) : null}

        <ChatInputBar
          value={input}
          onChangeText={setInput}
          onSend={() => onSend()}
          sending={sending}
          maxWidth={contentMaxWidth}
          horizontalPad={sidePad}
          showQuickReplies={messages.length > 0}
          keyboardVisible={keyboardVisible}
          quickReplies={quickReplies}
          onQuickReply={reply => {
            setInput(reply);
            void onSend(reply);
          }}
        />
      </View>

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
            <View className="mt-6 flex-row items-stretch gap-3">
              <View className="min-w-0 flex-1">
                <Button
                  title="Save word"
                  variant="lavender"
                  className="w-full"
                  onPress={() => {
                    const msg = messages.find(m => m.correction);
                    if (msg?.correction && vocabModal) {
                      void saveCorrection(msg, vocabModal.word);
                    }
                    setVocabModal(null);
                  }}
                />
              </View>
              <View className="min-w-0 flex-1">
                <Button title="Close" variant="outline" className="w-full" onPress={() => setVocabModal(null)} />
              </View>
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
