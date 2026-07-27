import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as api from '../api/endpoints';
import type { Conversation } from '../api/types';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LanguageBadge, LevelBadge } from '../components/Badges';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { TutorAvatar } from '../components/brand/TutorAvatar';
import { ErrorCard } from '../components/ui/ErrorCard';
import { GlassCard } from '../components/ui/GlassCard';
import { PressableScale } from '../components/ui/PressableScale';
import { PromptChip, SuggestionChips } from '../components/ui/PromptChip';
import { SkeletonList } from '../components/ui/Shimmer';
import { SplitHeadline } from '../components/ui/SplitHeadline';
import { DailyGoalWidget } from '../components/widgets/DailyGoalWidget';
import { EmptyStateWidget } from '../components/widgets/EmptyStateWidget';
import { StreakWidget } from '../components/widgets/StreakWidget';
import { CONVERSATION_TOPICS, SUGGESTED_PROMPTS } from '../constants/chatPrompts';
import { languageMeta, LAST_PRACTICE_KEY, PENDING_CHAT_PROMPT_KEY } from '../config/constants';
import type { RootStackParamList } from '../navigation/types';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/tokens';
import { softShadow } from '../theme/glass';

export function PracticeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { settings, user } = useAuth();
  const { isTablet } = useResponsive();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [streakLabel, setStreakLabel] = useState('Start today');

  const target = languageMeta(settings?.targetLanguage ?? 'es');
  const level = settings?.level ?? 'A1';
  const dailyGoal = settings?.dailyGoalMinutes ?? 10;
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?';

  const goalProgress = useMemo(() => {
    const today = new Date().toDateString();
    const todayChats = conversations.filter(
      c => new Date(c.createdAt).toDateString() === today,
    ).length;
    return Math.min(100, (todayChats / Math.max(dailyGoal / 5, 1)) * 100);
  }, [conversations, dailyGoal]);

  const load = useCallback(async () => {
    try {
      const [list, words] = await Promise.all([
        api.fetchConversations(),
        api.fetchVocabulary(),
      ]);
      setConversations(list);
      setWordCount(words.length);
      const last = await AsyncStorage.getItem(LAST_PRACTICE_KEY);
      const today = new Date().toDateString();
      setStreakLabel(last === today ? '1 day streak' : 'Start today');
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function startNewChat(initialPrompt?: string) {
    setCreating(true);
    setError('');
    try {
      const c = await api.createConversation();
      if (initialPrompt) {
        await AsyncStorage.setItem(PENDING_CHAT_PROMPT_KEY, initialPrompt);
      }
      navigation.navigate('Chat', {
        conversationId: c.id,
        title: c.title ?? 'Practice',
        guided: Boolean(initialPrompt),
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <Screen hasTabBar scroll>
        <SkeletonList count={4} />
      </Screen>
    );
  }

  return (
    <Screen scroll hasTabBar>
      <View className="mb-6 flex-row items-center justify-between">
        <View className="flex-1">
          <SplitHeadline primary={greeting} accent="!" />
          <Text className="mt-2 text-base leading-6 text-ink-muted">
            Ready to practice {target.label} today?
          </Text>
        </View>
        <View
          className="ml-4 h-12 w-12 items-center justify-center rounded-2xl"
          style={[{ backgroundColor: colors.primary }, softShadow(4)]}>
          <Text className="text-sm font-bold text-white">{initials}</Text>
        </View>
      </View>

      <View className={`mb-6 gap-3 ${isTablet ? 'flex-row' : 'flex-col'}`}>
        <StreakWidget label={streakLabel} />
        <DailyGoalWidget minutes={dailyGoal} progress={goalProgress} />
        <GlassCard className="flex-1 justify-center" tint="lavender">
          <Text className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Words saved
          </Text>
          <Text className="mt-1 text-3xl font-extrabold text-ink">{wordCount}</Text>
          <Text className="mt-1 text-xs text-ink-muted">From tutor corrections</Text>
        </GlassCard>
      </View>

      <GlassCard tint="lavender" className="mb-6">
        <View className="flex-row items-start gap-3">
          <TutorAvatar size="md" />
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-ink">Your AI tutor is ready</Text>
            <Text className="mt-2 text-base leading-6 text-ink-muted">
              Start a conversation — I'll correct gently and help you build vocabulary.
            </Text>
          </View>
        </View>
        <View className="mb-2 mt-5 flex-row flex-wrap gap-2">
          <LanguageBadge code={target.code} />
          <LevelBadge level={level} />
        </View>
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
          Suggested prompts
        </Text>
        <SuggestionChips
          prompts={SUGGESTED_PROMPTS.slice(0, 4)}
          onSelect={prompt => void startNewChat(prompt)}
        />
        <Button
          title="Start conversation"
          variant="lavender"
          loading={creating}
          className="mt-4"
          onPress={() => startNewChat()}
        />
      </GlassCard>

      <Text className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-faint">
        Topics
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
        {CONVERSATION_TOPICS.map(t => (
          <PromptChip
            key={t.label}
            emoji={t.emoji}
            label={t.label}
            onPress={() =>
              void startNewChat(`Let's practice a conversation about ${t.label.toLowerCase()}.`)
            }
          />
        ))}
      </ScrollView>

      <GlassCard tint="lavender" className="mb-8">
        <View className="mb-3 flex-row items-center gap-2">
          <LanguageBadge code={target.code} />
          <LevelBadge level={level} />
        </View>
        <Text className="text-xl font-extrabold text-ink">Continue in {target.label}</Text>
        <Text className="mt-2 text-base leading-6 text-ink-muted">
          Pick up where you left off or start fresh with your tutor.
        </Text>
        <Button
          title="New chat"
          variant="outline"
          loading={creating}
          className="mt-4"
          onPress={() => startNewChat()}
        />
      </GlassCard>

      {error ? (
        <View className="mb-4">
          <ErrorCard message={error} onRetry={load} />
        </View>
      ) : null}

      <Text className="mb-3 text-lg font-extrabold text-ink">Recent conversations</Text>
      {conversations.length === 0 ? (
        <EmptyStateWidget
          title="No conversations yet"
          subtitle="Tap a suggested prompt above to begin your first chat."
        />
      ) : (
        <FlatList
          scrollEnabled={false}
          data={conversations.slice(0, 5)}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <PressableScale
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: item.id,
                  title: item.title ?? 'Chat',
                })
              }
              className="mb-3">
              <GlassCard>
                <View className="flex-row items-center gap-3">
                  <TutorAvatar size="sm" />
                  <View className="flex-1">
                    <Text className="font-bold text-ink" numberOfLines={1}>
                      {item.title ?? 'Practice chat'}
                    </Text>
                    <Text className="mt-1 text-xs text-ink-muted">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text className="text-lg text-ink-faint">›</Text>
                </View>
              </GlassCard>
            </PressableScale>
          )}
        />
      )}
    </Screen>
  );
}
