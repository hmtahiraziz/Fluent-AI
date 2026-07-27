import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as api from '../api/endpoints';
import type { Conversation, VocabularyItem } from '../api/types';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { TutorAvatar } from '../components/brand/TutorAvatar';
import { ErrorCard } from '../components/ui/ErrorCard';
import { PressableScale } from '../components/ui/PressableScale';
import { ProfileAvatar } from '../components/ui/ProfileAvatar';
import { StreakBadge } from '../components/ui/StreakBadge';
import { SkeletonList } from '../components/ui/Shimmer';
import { DailyGoalWidget } from '../components/widgets/DailyGoalWidget';
import { FOR_YOU_ITEMS, HOME_TOPIC_CHIPS, LEARNING_TIP } from '../constants/homeContent';
import { languageMeta, PENDING_CHAT_PROMPT_KEY } from '../config/constants';
import { getStreakDisplay } from '../services/streakStorage';
import type { RootStackParamList } from '../navigation/types';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/tokens';
import { softShadow } from '../theme/glass';

function HomeHeader({
  name,
  initials,
  avatarUri,
  streakLabel,
}: {
  name: string;
  initials: string;
  avatarUri: string | null;
  streakLabel: string;
}) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();

  return (
    <View
      className="mb-6 flex-row items-center justify-between gap-2 bg-canvas"
      style={{
        marginTop: -(insets.top + 8),
        paddingTop: insets.top + 8,
        marginHorizontal: -horizontalPadding,
        paddingHorizontal: horizontalPadding,
        paddingBottom: 8,
      }}>
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <ProfileAvatar uri={avatarUri} initials={initials} name={name} size="sm" />
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-medium text-ink-muted">Welcome back,</Text>
          <Text className="text-2xl font-bold leading-none text-brand" numberOfLines={1}>
            {name}
          </Text>
        </View>
      </View>
      <StreakBadge label={streakLabel} />
    </View>
  );
}

function TopicChipRow({
  activeLabel,
  onSelect,
}: {
  activeLabel: string | null;
  onSelect: (chip: (typeof HOME_TOPIC_CHIPS)[number]) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {HOME_TOPIC_CHIPS.map(chip => {
        const active = activeLabel === chip.label;
        return (
          <PressableScale key={chip.label} onPress={() => onSelect(chip)}>
            <View
              className="rounded-full px-6 py-2.5"
              style={{
                backgroundColor: active ? colors.secondaryContainer : colors.surfaceContainer,
              }}>
              <Text
                className="text-sm font-bold"
                style={{ color: active ? colors.onSecondaryContainer : colors.inkMuted }}>
                {chip.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

function ForYouCard({
  title,
  meta,
  emoji,
  onPress,
}: {
  title: string;
  meta: string;
  emoji: string;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress}>
      <View
        className="mb-3 flex-row items-center gap-4 rounded-[24px] p-4"
        style={[{ backgroundColor: colors.surface }, softShadow()]}>
        <View
          className="h-16 w-16 items-center justify-center overflow-hidden rounded-2xl"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-2xl">{emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-ink">{title}</Text>
          <Text className="mt-0.5 text-base text-ink-muted">{meta}</Text>
        </View>
        <Text className="text-xl text-ink-faint">›</Text>
      </View>
    </PressableScale>
  );
}

export function PracticeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { settings } = useAuth();
  const { resolvedName, initials, avatarUri, reload } = useProfile();
  const { isTablet } = useResponsive();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [streakLabel, setStreakLabel] = useState('Start today');
  const [activeTopic, setActiveTopic] = useState<string | null>('Grammar');

  const target = languageMeta(settings?.targetLanguage ?? 'es');
  const level = settings?.level ?? 'A1';
  const dailyGoal = settings?.dailyGoalMinutes ?? 10;

  const lastConversation = conversations[0] ?? null;

  const resumeSubtitle = useMemo(() => {
    if (lastConversation?.title) {
      return `You were learning about '${lastConversation.title}' in ${target.label}.`;
    }
    return `Ready to practice ${target.label} at ${level} level?`;
  }, [lastConversation?.title, target.label, level]);

  const goalProgress = useMemo(() => {
    const today = new Date().toDateString();
    const todayChats = conversations.filter(
      c => new Date(c.createdAt).toDateString() === today,
    ).length;
    return Math.min(100, (todayChats / Math.max(dailyGoal / 5, 1)) * 100);
  }, [conversations, dailyGoal]);

  const wordsToday = useMemo(() => {
    const today = new Date().toDateString();
    return vocabulary.filter(w => new Date(w.createdAt).toDateString() === today).length;
  }, [vocabulary]);

  const load = useCallback(async () => {
    try {
      const [list, words] = await Promise.all([
        api.fetchConversations(),
        api.fetchVocabulary(),
      ]);
      setConversations(list);
      setVocabulary(words);
      setStreakLabel(await getStreakDisplay());
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      void reload();
    }, [load, reload]),
  );

  async function startNewChat(initialPrompt?: string) {
    setCreating(true);
    setError('');
    try {
      const c = await api.createConversation(
        initialPrompt ? initialPrompt.slice(0, 80) : undefined,
      );
      if (initialPrompt) {
        await AsyncStorage.setItem(
          PENDING_CHAT_PROMPT_KEY,
          JSON.stringify({ conversationId: c.id, prompt: initialPrompt }),
        );
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

  function resumeChat() {
    if (lastConversation) {
      navigation.navigate('Chat', {
        conversationId: lastConversation.id,
        title: lastConversation.title ?? 'Practice',
      });
      return;
    }
    void startNewChat();
  }

  if (loading) {
    return (
      <Screen hasTabBar scroll>
        <HomeHeader
          name={resolvedName}
          initials={initials}
          avatarUri={avatarUri}
          streakLabel={streakLabel}
        />
        <SkeletonList count={4} />
      </Screen>
    );
  }

  return (
    <Screen scroll hasTabBar>
      <HomeHeader
        name={resolvedName}
        initials={initials}
        avatarUri={avatarUri}
        streakLabel={streakLabel}
      />

      <View
        className="mb-6 overflow-hidden rounded-[24px] p-6"
        style={{ backgroundColor: colors.insight }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <View className="mb-1 flex-row items-center gap-2">
              <Text className="text-base">✨</Text>
              <Text
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: colors.tertiary }}>
                AI Tutor
              </Text>
            </View>
            <Text
              className="text-[28px] font-bold leading-9"
              style={{ color: '#1f1c0a' }}>
              Continue Practice
            </Text>
            <Text className="mt-2 max-w-[200px] text-base leading-6 text-tertiary">
              {resumeSubtitle}
            </Text>
          </View>
          <View className="h-24 w-24 items-center justify-center">
            <TutorAvatar size="md" />
          </View>
        </View>
        <Button
          title="Resume Chat"
          variant="dark"
          loading={creating}
          className="mt-6"
          onPress={resumeChat}
        />
      </View>

      <View className="mb-6">
        <TopicChipRow
          activeLabel={activeTopic}
          onSelect={chip => {
            setActiveTopic(chip.label);
            void startNewChat(chip.prompt);
          }}
        />
      </View>

      <View className={`mb-4 gap-4 ${isTablet ? 'flex-row' : 'flex-row flex-wrap'}`}>
        <View className="min-w-[45%] flex-1">
          <DailyGoalWidget minutes={dailyGoal} progress={goalProgress} />
        </View>
        <View
          className="min-w-[45%] flex-1 justify-between rounded-[24px] p-5"
          style={[{ backgroundColor: colors.surface, minHeight: 180 }, softShadow()]}>
          <View className="flex-row items-start justify-between">
            <Text className="text-xs font-medium text-ink-muted">Words Saved</Text>
            <Text className="text-lg" style={{ color: colors.secondary }}>
              📖
            </Text>
          </View>
          <View className="mt-4">
            <Text className="text-[40px] font-extrabold leading-none text-ink">
              {vocabulary.length}
            </Text>
            <Text className="mt-1 text-xs font-medium text-ink-muted">
              {wordsToday > 0 ? `+${wordsToday} today` : 'From tutor corrections'}
            </Text>
          </View>
          <View
            className="mt-4 h-1 overflow-hidden rounded-full"
            style={{ backgroundColor: colors.surfaceContainer }}>
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, vocabulary.length > 0 ? 66 : 0)}%`,
                backgroundColor: colors.secondary,
              }}
            />
          </View>
        </View>
      </View>

      <View
        className="mb-8 flex-row items-center gap-4 rounded-[24px] p-5"
        style={{ backgroundColor: colors.primaryContainer }}>
        <View className="rounded-2xl p-3" style={{ backgroundColor: colors.primary }}>
          <Text className="text-lg text-white">💡</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold" style={{ color: colors.onPrimaryContainer }}>
            Learning Tip
          </Text>
          <Text
            className="mt-1 text-base leading-6"
            style={{ color: colors.onPrimaryContainer, opacity: 0.9 }}>
            {LEARNING_TIP}
          </Text>
        </View>
      </View>

      {error ? (
        <View className="mb-4">
          <ErrorCard message={error} onRetry={load} />
        </View>
      ) : null}

      <Text className="mb-4 px-1 text-2xl font-bold text-ink">For You</Text>
      {FOR_YOU_ITEMS.map(item => (
        <ForYouCard
          key={item.id}
          title={item.title}
          meta={item.meta}
          emoji={item.emoji}
          onPress={() => void startNewChat(item.prompt)}
        />
      ))}
    </Screen>
  );
}
