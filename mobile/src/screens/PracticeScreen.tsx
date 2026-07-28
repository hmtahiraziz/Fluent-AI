import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as api from '../api/endpoints';
import type { Conversation, VocabularyItem } from '../api/types';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { Screen } from '../components/Screen';
import { ErrorCard } from '../components/ui/ErrorCard';
import { PressableScale } from '../components/ui/PressableScale';
import { ProfileAvatar } from '../components/ui/ProfileAvatar';
import { StreakBadge } from '../components/ui/StreakBadge';
import { SkeletonList } from '../components/ui/Shimmer';
import { DailyGoalWidget } from '../components/widgets/DailyGoalWidget';
import { FOR_YOU_ITEMS, HOME_TOPIC_CHIPS, LEARNING_TIP } from '../constants/homeContent';
import {
  findResumableConversation,
  getOtherLanguageConversations,
  PracticeChatHero,
  RecentConversations,
  useChatLauncher,
  useLanguagePair,
} from '../features/chat';
import { getStreakDisplay } from '../services/streakStorage';
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
  const { settings, refreshSettings } = useAuth();
  const languagePair = useLanguagePair();
  const { startNewChat, resumeConversation, creating, error, setError } = useChatLauncher();
  const { resolvedName, initials, avatarUri, reload } = useProfile();
  const { isTablet } = useResponsive();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [streakLabel, setStreakLabel] = useState('Start today');
  const [activeTopic, setActiveTopic] = useState<string | null>('Grammar');

  const dailyGoal = settings?.dailyGoalMinutes ?? 10;

  const resumable = useMemo(() => {
    if (!settings) return null;
    return findResumableConversation(conversations, settings);
  }, [conversations, settings]);

  const otherConversations = useMemo(() => {
    if (!settings) return conversations;
    return getOtherLanguageConversations(conversations, settings);
  }, [conversations, settings]);

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
  }, [setError]);

  useFocusEffect(
    useCallback(() => {
      void refreshSettings();
      void load();
      void reload();
    }, [refreshSettings, load, reload]),
  );

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

      <PracticeChatHero
        languagePair={languagePair}
        resumable={resumable}
        onStartNew={() => void startNewChat()}
        onResume={() => resumable && resumeConversation(resumable)}
        loading={creating}
      />

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

      <RecentConversations
        conversations={otherConversations}
        currentTarget={languagePair.targetCode}
        onOpen={resumeConversation}
      />

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
