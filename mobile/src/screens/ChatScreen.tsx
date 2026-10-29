import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  type AppStateStatus,
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as api from '../api/endpoints';
import type { Message, VocabularySuggestion } from '../api/types';
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
  isRtlTargetLanguage,
  LanguageMismatchBanner,
  LanguagePairPill,
  useLanguagePair,
} from '../features/chat';
import { useAuth } from '../context/AuthContext';
import { languageMeta, PENDING_CHAT_PROMPT_KEY } from '../config/constants';
import { formatStreakLabel, getStreakDisplay, recordPracticeDay } from '../services/streakStorage';
import { PracticeTimerSession } from '../services/practiceTimeStorage';
import {
  retryPendingPracticeSync,
  syncPracticeCumulative,
} from '../services/practiceSync';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import type { RootStackParamList } from '../navigation/types';
import { useResponsive } from '../hooks/useResponsive';
import { bottomChromePadding } from '../theme/safeArea';
import { colors } from '../theme/tokens';

function createClientRequestId(): string {
  const cryptoApi = (
    globalThis as typeof globalThis & {
      crypto?: { randomUUID?: () => string };
    }
  ).crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

import type { LanguagePairInfo } from '../features/chat';

function ChatHeader({
  onBack,
  streakLabel,
  horizontalPad,
  topInset,
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
        paddingBottom: 10,
        paddingHorizontal: horizontalPad,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-2 h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surfaceContainer }}>
          <Text className="text-lg font-bold text-brand">←</Text>
        </Pressable>

        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <TutorAvatar size="sm" />
          <View className="min-w-0 flex-1">
            <Text className="text-lg font-bold text-brand" numberOfLines={1}>
              AI Tutor
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-success" />
              <Text className="text-xs font-medium text-ink-muted">Online</Text>
            </View>
          </View>
        </View>

        <View className="ml-2">
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
  const {
    conversationId,
    guided,
    language: routeLanguage,
    level: routeLevel,
  } = route.params;
  const insets = useSafeAreaInsets();
  const { user, settings, acceptLlmConsent } = useAuth();
  const settingsLanguagePair = useLanguagePair();
  // Prefer conversation snapshot from route params so the header matches the tutor.
  const languagePair = React.useMemo(() => {
    if (!routeLanguage && !routeLevel) return settingsLanguagePair;
    const targetCode = routeLanguage ?? settingsLanguagePair.targetCode;
    const level = routeLevel ?? settingsLanguagePair.level;
    const target = languageMeta(targetCode);
    const native = settingsLanguagePair.native;
    return {
      ...settingsLanguagePair,
      targetCode,
      level,
      target,
      label: `${native.label} → ${target.label}`,
      subtitle: `${native.label} to ${target.label} • ${level}`,
    };
  }, [routeLanguage, routeLevel, settingsLanguagePair]);
  const [consentBusy, setConsentBusy] = useState(false);
  const needsLlmConsent = settings != null && settings.hasLlmConsent !== true;
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
  /** Reused only when retrying the same text; new text = new id. */
  const pendingRequestRef = useRef<{ id: string; text: string } | null>(null);

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
    void getStreakDisplay(user?.id).then(setStreakLabel);
  }, [user?.id]);

  // Count practice minutes only while Chat is focused and the app is active.
  // Checkpoint every 45s + sync cumulative total; crash only loses the last interval.
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return undefined;
      const userId = user.id;
      const session = new PracticeTimerSession(userId);
      let focused = true;
      let interval: ReturnType<typeof setInterval> | null = null;

      const flushAndSync = async (mode: 'checkpoint' | 'stop') => {
        if (mode === 'checkpoint') {
          await session.checkpoint();
        } else {
          await session.stop();
        }
        await syncPracticeCumulative(userId);
      };

      const onAppState = (state: AppStateStatus) => {
        if (!focused) return;
        if (state === 'active') {
          void retryPendingPracticeSync(userId);
          session.start();
        } else {
          void flushAndSync('stop');
        }
      };

      void retryPendingPracticeSync(userId);
      if (AppState.currentState === 'active') {
        session.start();
      }

      interval = setInterval(() => {
        if (!focused || AppState.currentState !== 'active') return;
        void flushAndSync('checkpoint');
      }, 45_000);

      const sub = AppState.addEventListener('change', onAppState);
      return () => {
        focused = false;
        if (interval) clearInterval(interval);
        sub.remove();
        void flushAndSync('stop');
      };
    }, [user?.id]),
  );

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

  async function ensureConsent(): Promise<boolean> {
    if (!needsLlmConsent) return true;
    setError('Please accept AI tutoring consent before chatting.');
    return false;
  }

  async function onAcceptConsent() {
    setConsentBusy(true);
    setError('');
    try {
      await acceptLlmConsent();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setConsentBusy(false);
    }
  }

  function onReportMessage(message: Message) {
    Alert.alert('Report AI content', 'Why are you reporting this reply?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Inappropriate',
        onPress: () => void submitReport(message, 'inappropriate'),
      },
      {
        text: 'Harmful',
        onPress: () => void submitReport(message, 'harmful'),
      },
      {
        text: 'Incorrect',
        onPress: () => void submitReport(message, 'incorrect'),
      },
    ]);
  }

  async function submitReport(
    message: Message,
    reason: 'inappropriate' | 'harmful' | 'incorrect' | 'spam' | 'other',
  ) {
    try {
      await api.reportContent({
        conversationId,
        messageId: message.id,
        reason,
      });
      Alert.alert('Thanks', 'Your report was submitted for review.');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function onSend(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    if (!(await ensureConsent())) return;
    setInput('');
    setSending(true);
    setError('');
    if (!pendingRequestRef.current || pendingRequestRef.current.text !== text) {
      pendingRequestRef.current = { id: createClientRequestId(), text };
    }
    const clientRequestId = pendingRequestRef.current.id;
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
      const result = await api.sendChatMessage(
        conversationId,
        text,
        clientRequestId,
      );
      const assistant: Message = {
        ...result.assistantMessage,
        vocabularySuggestions:
          result.assistantMessage.vocabularySuggestions ??
          result.vocabularySuggestions ??
          null,
      };
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== optimistic.id);
        return [...withoutTemp, result.userMessage, assistant];
      });
      pendingRequestRef.current = null;
      const count = await recordPracticeDay(user?.id);
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
      // Keep pendingRequestRef so ErrorCard retry reuses the same idempotency key.
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

  async function saveSuggestion(message: Message, suggestion: VocabularySuggestion) {
    setSavingId(`${message.id}:${suggestion.term}`);
    try {
      await api.createVocabularyItem({
        phrase: suggestion.term,
        translation: suggestion.meaning,
        sourceMessageId: message.id,
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSavingId(null);
    }
  }

  const sidePad = horizontalPadding;
  // useKeyboardInset is for scroll-to-end only — KeyboardStickyView owns positioning.
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

      <View className="flex-1">
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
              <View className="mb-4">
                <ChatBubble message={item} />
                {item.role === 'assistant' && !item.id.startsWith('temp-') ? (
                  <Pressable
                    onPress={() => onReportMessage(item)}
                    accessibilityRole="button"
                    accessibilityLabel="Report AI content"
                    className="mt-1 self-start px-1 py-1">
                    <Text className="text-xs font-semibold text-ink-faint">Report</Text>
                  </Pressable>
                ) : null}
                {item.role === 'user' && item.correction ? (
                  <CorrectionCard
                    correction={item.correction}
                    onSave={() => saveCorrection(item)}
                    onPractice={() => onSend(item.correction!.original)}
                    saving={savingId === item.id}
                  />
                ) : null}
                {item.role === 'assistant' &&
                (item.vocabularySuggestions?.length ?? 0) > 0 ? (
                  <View className="mt-2 gap-2">
                    <Text className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                      Suggested words
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {item.vocabularySuggestions!.map((s: VocabularySuggestion) => (
                        <Pressable
                          key={`${item.id}-${s.term}`}
                          onPress={() => saveSuggestion(item, s)}
                          disabled={savingId === `${item.id}:${s.term}`}
                          className="rounded-full px-3 py-2"
                          style={{ backgroundColor: colors.surfaceContainer }}>
                          <Text className="text-sm font-semibold text-brand">
                            {s.term}
                          </Text>
                          <Text className="text-xs text-ink-muted">{s.meaning}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            )}
            ListHeaderComponent={
              messages.length > 0 ? <ChatDatePill label="Today" /> : null
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center py-8">
                <View className="items-center px-2">
                  <TutorAvatar size="lg" />
                  <Text className="mt-5 text-center text-xl font-extrabold text-ink">
                    Hi! I'm your FluentAI tutor
                  </Text>
                  <Text className="mt-2.5 max-w-sm text-center text-sm leading-6 text-ink-muted">
                    Practice {languagePair.target.label} at {languagePair.level} level. I'll gently
                    correct your grammar and help you learn new phrases. Replies are AI-generated and
                    may be imperfect — use Report on any message that looks wrong or unsafe.
                  </Text>
                </View>
                <Text className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-ink-faint">
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

        {/*
          Single keyboard-offset owner: KeyboardStickyView translates with the keyboard.
          Do not add opened offsets that fight ChatInputBar's closed-state safe-area padding
          (that under-lifts the composer into the keyboard on Android).
        */}
        <KeyboardStickyView
          offset={{ closed: 0, opened: 0 }}
          style={{ flexShrink: 0, backgroundColor: colors.canvas }}>
          {needsLlmConsent ? (
            <View
              style={{
                paddingHorizontal: sidePad,
                paddingTop: 16,
                paddingBottom: bottomChromePadding(insets.bottom, {
                  keyboardOpen: keyboardVisible,
                }),
                backgroundColor: colors.canvas,
                borderTopWidth: 1,
                borderTopColor: colors.borderLight,
              }}>
              <View
                style={{
                  width: '100%',
                  maxWidth: contentMaxWidth,
                  alignSelf: 'center',
                }}>
                <Text className="mb-3 text-sm leading-5 text-ink-muted">
                  FluentAI sends your messages to an AI language model to generate tutor replies and
                  corrections. Continue only if you agree.
                </Text>
                <Button
                  title="I agree — start tutoring"
                  variant="lavender"
                  loading={consentBusy}
                  onPress={() => void onAcceptConsent()}
                />
              </View>
            </View>
          ) : (
            <ChatInputBar
              value={input}
              onChangeText={setInput}
              onSend={() => onSend()}
              sending={sending}
              maxWidth={contentMaxWidth}
              horizontalPad={sidePad}
              showQuickReplies={messages.length > 0}
              keyboardVisible={keyboardVisible}
              rtl={isRtlTargetLanguage(chatLanguage)}
              quickReplies={quickReplies}
              onQuickReply={reply => {
                setInput(reply);
                void onSend(reply);
              }}
            />
          )}
        </KeyboardStickyView>
      </View>

      <Modal visible={celebrate} transparent animationType="fade">
        <View
          className="flex-1 items-center justify-center bg-ink/40 px-8"
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: bottomChromePadding(insets.bottom),
          }}>
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
