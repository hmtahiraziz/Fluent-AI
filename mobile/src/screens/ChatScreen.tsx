import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
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
import { ChatBubble, ChatDatePill } from '../components/ui/ChatBubble';
import { ChatInputBar } from '../components/ui/ChatInputBar';
import { CorrectionCard } from '../components/ui/CorrectionCard';
import { ErrorCard } from '../components/ui/ErrorCard';
import { SkeletonList } from '../components/ui/Shimmer';
import { SuggestionChips } from '../components/ui/PromptChip';
import { TypingIndicator } from '../components/ui/TypingIndicator';
import { SUGGESTED_PROMPTS } from '../constants/chatPrompts';
import { LAST_PRACTICE_KEY, PENDING_CHAT_PROMPT_KEY } from '../config/constants';
import type { RootStackParamList } from '../navigation/types';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId, guided } = route.params;
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
  const [vocabModal, setVocabModal] = useState<{ word: string; translation?: string } | null>(
    null,
  );

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setError('');
    setInput('');
  }, [conversationId]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {});

    return () => {
      showSub.remove();
      hideSub.remove();
    };
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

  return (
    <View className="flex-1" style={{ backgroundColor: colors.canvas }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{
          paddingTop: insets.top + 8,
          backgroundColor: colors.canvas,
        }}>
        <Pressable
          onPress={() => navigation.goBack()}
          className="mr-2 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surfaceContainer }}>
          <Text className="text-xl font-bold text-brand">←</Text>
        </Pressable>
        <View className="flex-1 flex-row items-center gap-3">
          <View
            className="overflow-hidden rounded-full border"
            style={{ borderColor: colors.border }}>
            <TutorAvatar size="sm" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-brand" numberOfLines={1}>
              AI Tutor
            </Text>
            <View className="flex-row items-center gap-1">
              <View className="h-2 w-2 rounded-full bg-success" />
              <Text className="text-xs font-medium text-ink-muted">Online</Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.surfaceContainer }}>
            <Text className="text-base text-brand">🔍</Text>
          </Pressable>
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: colors.primarySoft }}>
            <Text className="text-sm font-bold" style={{ color: colors.primaryDark }}>
              🔥 7 Days
            </Text>
          </View>
        </View>
      </View>

      {/* Messages — flex area */}
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
          onContentSizeChange={() =>
            messages.length > 0 && listRef.current?.scrollToEnd({ animated: false })
          }
          renderItem={({ item }) => (
            <View className="mb-2">
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
                  Practice conversations in your target language. I'll gently correct your grammar
                  and help you learn new phrases.
                </Text>
              </View>
              <Text className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-ink-faint">
                Try a prompt
              </Text>
              <SuggestionChips
                prompts={SUGGESTED_PROMPTS}
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

      {/* Footer — keyboard-aware input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <View>
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
            maxWidth={contentMaxWidth}
            horizontalPad={sidePad}
            showQuickReplies={messages.length > 0}
            onQuickReply={reply => {
              setInput(reply);
              void onSend(reply);
            }}
          />
        </View>
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
