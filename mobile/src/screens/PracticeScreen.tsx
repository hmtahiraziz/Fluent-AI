import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as api from '../api/endpoints';
import type { Conversation, VocabularyStats, WeeklyProgress } from '../api/types';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { FluentAIBrand } from '../components/brand/FluentAILogo';
import { Screen } from '../components/Screen';
import { ErrorCard } from '../components/ui/ErrorCard';
import { PressableScale } from '../components/ui/PressableScale';
import { ProfileAvatar } from '../components/ui/ProfileAvatar';
import { StreakBadge } from '../components/ui/StreakBadge';
import { SkeletonList } from '../components/ui/Shimmer';
import { DailyGoalWidget } from '../components/widgets/DailyGoalWidget';
import { WeeklyProgressCard } from '../components/widgets/WeeklyProgressCard';
import { WordsSavedCard } from '../components/widgets/WordsSavedCard';
import { retryPendingPracticeSync } from '../services/practiceSync';
import { learningTipForDay } from '../constants/homeContent';
import {
  findResumableConversation,
  getOtherLanguageConversations,
  getPracticeTopics,
  isPracticeTopic,
  LanguagePairPill,
  PracticeChatHero,
  RecentConversations,
  rankHomeRecommendations,
  useChatLauncher,
  useLanguagePair,
  type HomeRecommendation,
  type PracticeTopicChip,
} from '../features/chat';
import { getStreakDisplay } from '../services/streakStorage';
import {
  getTodayPracticeMinutes,
  localDayKey,
  startOfLocalDay,
} from '../services/practiceTimeStorage';
import { useResponsive } from '../hooks/useResponsive';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors } from '../theme/tokens';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Practice'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const TOPIC_ICONS: Record<string, string> = {
  grammar: '🎓',
  culture: '🌍',
  business: '💼',
  travel: '✈️',
};

function timeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function motivationalLine(practiceMinutes: number, streakLabel: string): string {
  if (practiceMinutes > 0) return "Keep going! You're making great progress.";
  if (streakLabel !== 'Start today') return 'Nice streak — a short practice keeps it alive.';
  return 'A few minutes today builds lasting fluency.';
}

function HomeHeader({
  name,
  initials,
  avatarUri,
  streakLabel,
  languagePair,
  practiceMinutes,
  onLanguagePress,
  onProfilePress,
}: {
  name: string;
  initials: string;
  avatarUri: string | null;
  streakLabel: string;
  languagePair: ReturnType<typeof useLanguagePair>;
  practiceMinutes: number;
  onLanguagePress: () => void;
  onProfilePress: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const topPad = insets.top + (isTablet ? 12 : 8);
  const firstName = name.trim().split(/\s+/)[0] || name;

  return (
    <View
      className="mb-4 bg-canvas"
      style={{
        marginTop: -topPad,
        paddingTop: topPad,
        marginHorizontal: -horizontalPadding,
        paddingHorizontal: horizontalPadding,
        paddingBottom: 4,
      }}>
      <View className="mb-4 flex-row items-center justify-between gap-2">
        <FluentAIBrand
          iconSize={32}
          wordmarkClassName="text-xl font-extrabold text-brand"
        />
        <View className="flex-row items-center gap-2.5">
          <StreakBadge label={streakLabel} />
          <PressableScale onPress={onProfilePress} accessibilityLabel="Open profile">
            <ProfileAvatar uri={avatarUri} initials={initials} name={name} size="sm" />
          </PressableScale>
        </View>
      </View>

      <View className="min-w-0 pr-1">
        <Text className="text-[15px] font-semibold leading-5 text-ink-muted">
          {timeGreeting()},
        </Text>
        <Text
          className="mt-0.5 text-[26px] font-extrabold leading-8 text-ink"
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.85}>
          {firstName} 👋
        </Text>
        <Text className="mt-1.5 text-sm leading-5 text-ink-muted" numberOfLines={2}>
          {motivationalLine(practiceMinutes, streakLabel)}
        </Text>

        <PressableScale
          onPress={onLanguagePress}
          className="mt-3 self-start"
          accessibilityLabel={`${languagePair.label}, CEFR ${languagePair.level}. Open language settings`}>
          <LanguagePairPill
            native={languagePair.native}
            target={languagePair.target}
            level={languagePair.level}
            compact
            style={{
              borderWidth: 1,
              borderColor: colors.borderLight,
              backgroundColor: colors.surface,
            }}
          />
        </PressableScale>
      </View>
    </View>
  );
}

function TopicChipRow({
  topics,
  activeId,
  onSelect,
  disabled,
}: {
  topics: PracticeTopicChip[];
  activeId: string | null;
  onSelect: (chip: PracticeTopicChip) => void;
  disabled?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingVertical: 2, paddingRight: 8 }}>
      {topics.map(chip => {
        const active = activeId === chip.id;
        const icon = TOPIC_ICONS[chip.id] ?? '✨';
        return (
          <PressableScale
            key={chip.id}
            onPress={() => onSelect(chip)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: Boolean(disabled) }}
            accessibilityLabel={`Practice ${chip.label}`}>
            <View
              className="flex-row items-center gap-2 rounded-full px-4"
              style={{
                backgroundColor: active ? colors.secondary : colors.surfaceContainer,
                minHeight: 44,
                justifyContent: 'center',
                opacity: disabled ? 0.6 : 1,
              }}>
              <Text className="text-sm">{icon}</Text>
              <Text
                className="text-sm font-bold"
                style={{ color: active ? '#fff' : colors.inkMuted }}>
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
  item,
  onPress,
  disabled,
}: {
  item: HomeRecommendation;
  onPress: () => void;
  disabled?: boolean;
}) {
  const meta =
    item.id === 'travel-ready' || item.category === 'Travel'
      ? `Motivation • ${item.category}`
      : `${item.durationMinutes} min • ${item.category}`;

  return (
    <PressableScale onPress={onPress} disabled={disabled}>
      <View
        className="mb-3 flex-row items-center gap-3.5 rounded-[22px] p-3.5"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderLight,
          opacity: disabled ? 0.6 : 1,
        }}>
        <View
          className="h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-2xl">{item.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-ink">{item.title}</Text>
          <Text className="mt-0.5 text-xs font-semibold text-ink-muted">{meta}</Text>
          <Text className="mt-1 text-xs leading-4 text-ink-faint" numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <Text className="text-lg text-ink-faint">›</Text>
      </View>
    </PressableScale>
  );
}

export function PracticeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { user, settings, refreshSettings } = useAuth();
  const languagePair = useLanguagePair();
  const { startNewChat, resumeConversation, creating, error, setError } = useChatLauncher();
  const { resolvedName, initials, avatarUri, reload } = useProfile();
  const { isTablet } = useResponsive();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [vocabStats, setVocabStats] = useState<VocabularyStats | null>(null);
  const [practiceMinutes, setPracticeMinutes] = useState(0);
  const [weekly, setWeekly] = useState<WeeklyProgress | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streakLabel, setStreakLabel] = useState('Start today');
  const [activeTopicId, setActiveTopicId] = useState<string | null>('grammar');
  const [conversationsError, setConversationsError] = useState('');
  const [statsError, setStatsError] = useState('');
  const [showAllForYou, setShowAllForYou] = useState(false);
  const [dayKey] = useState(() => localDayKey());
  const requestIdRef = useRef(0);
  const weeklyRequestIdRef = useRef(0);
  const hasDataRef = useRef(false);

  const dailyGoal = settings?.dailyGoalMinutes ?? 10;
  const practiceTopics = useMemo(
    () => getPracticeTopics(languagePair.targetCode),
    [languagePair.targetCode],
  );

  const forYouAll = useMemo(
    () =>
      rankHomeRecommendations({
        targetLanguage: languagePair.targetCode,
        cefrLevel: settings?.level ?? languagePair.level,
        motivation: settings?.motivation,
        activeTopicId,
        dayKey,
        limit: 4,
      }),
    [
      languagePair.targetCode,
      languagePair.level,
      settings?.level,
      settings?.motivation,
      activeTopicId,
      dayKey,
    ],
  );

  const forYouItems = showAllForYou ? forYouAll : forYouAll.slice(0, 2);
  const learningTip = useMemo(() => learningTipForDay(dayKey), [dayKey]);

  const resumable = useMemo(() => {
    if (!settings) return null;
    return findResumableConversation(conversations, settings);
  }, [conversations, settings]);

  const otherConversations = useMemo(() => {
    if (!settings) return conversations;
    return getOtherLanguageConversations(conversations, settings);
  }, [conversations, settings]);

  const loadConversations = useCallback(async () => {
    try {
      const list = await api.fetchConversations();
      setConversations(list);
      setConversationsError('');
      return list;
    } catch (e) {
      setConversationsError(getErrorMessage(e));
      throw e;
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const since = startOfLocalDay().toISOString();
      const stats = await api.fetchVocabularyStats(undefined, { createdSince: since });
      setVocabStats(stats);
      setStatsError('');
    } catch (e) {
      setStatsError(getErrorMessage(e));
    }
  }, []);

  const loadWeekly = useCallback(async () => {
    const requestId = ++weeklyRequestIdRef.current;
    setWeeklyLoading(true);
    try {
      await retryPendingPracticeSync(user?.id);
      if (requestId !== weeklyRequestIdRef.current) return;
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const data = await api.fetchWeeklyProgress(timeZone);
      if (requestId !== weeklyRequestIdRef.current) return;
      setWeekly(data);
      setWeeklyError('');
    } catch (e) {
      if (requestId !== weeklyRequestIdRef.current) return;
      setWeeklyError(getErrorMessage(e));
    } finally {
      if (requestId === weeklyRequestIdRef.current) {
        setWeeklyLoading(false);
      }
    }
  }, [user?.id]);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (hasDataRef.current) setRefreshing(true);

    try {
      const [, , streak, minutes] = await Promise.all([
        loadConversations().catch(() => null),
        loadStats(),
        getStreakDisplay(user?.id),
        getTodayPracticeMinutes(user?.id),
        loadWeekly(),
      ]);
      if (requestId !== requestIdRef.current) return;
      setStreakLabel(streak);
      setPracticeMinutes(minutes);
      hasDataRef.current = true;
      setError('');
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(getErrorMessage(e));
    } finally {
      if (requestId === requestIdRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [loadConversations, loadStats, loadWeekly, setError, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void refreshSettings();
      void load();
      void reload();
      return () => {
        requestIdRef.current += 1;
        weeklyRequestIdRef.current += 1;
      };
    }, [refreshSettings, load, reload]),
  );

  const startTopicChat = useCallback(
    (chip: PracticeTopicChip) => {
      const topic = isPracticeTopic(chip.id) ? chip.id : undefined;
      setActiveTopicId(chip.id);
      void startNewChat({
        topic,
        scenario: chip.label,
        initialPrompt: chip.prompt,
        source: topic ? 'home_topic' : 'home_new',
      });
    },
    [startNewChat],
  );

  const onStartLearning = useCallback(() => {
    const chip = practiceTopics.find(t => t.id === activeTopicId);
    if (chip) {
      startTopicChat(chip);
      return;
    }
    void startNewChat({ source: 'home_new' });
  }, [activeTopicId, practiceTopics, startNewChat, startTopicChat]);

  const onRecommendation = useCallback(
    (item: HomeRecommendation) => {
      void startNewChat({
        topic: item.topic,
        scenario: item.scenario,
        initialPrompt: item.prompt,
        source: 'home_recommendation',
      });
    },
    [startNewChat],
  );

  const headerProps = {
    name: resolvedName,
    initials,
    avatarUri,
    streakLabel,
    languagePair,
    practiceMinutes,
    onLanguagePress: () => navigation.navigate('Settings'),
    onProfilePress: () => navigation.navigate('Settings'),
  };

  if (initialLoading) {
    return (
      <Screen hasTabBar scroll>
        <HomeHeader {...headerProps} />
        <SkeletonList count={4} />
      </Screen>
    );
  }

  return (
    <Screen scroll hasTabBar>
      <HomeHeader {...headerProps} />

      {refreshing ? (
        <View className="mb-3 flex-row items-center justify-center gap-2 py-1">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="text-xs font-medium text-ink-muted">Updating…</Text>
        </View>
      ) : null}

      <PracticeChatHero
        resumable={resumable}
        onStartNew={onStartLearning}
        onResume={() => resumable && resumeConversation(resumable)}
        loading={creating}
      />

      {conversationsError ? (
        <View className="mb-4">
          <ErrorCard
            message={conversationsError}
            onRetry={() => void loadConversations().catch(() => undefined)}
          />
        </View>
      ) : null}

      <View className="mb-5">
        <TopicChipRow
          topics={practiceTopics}
          activeId={activeTopicId}
          disabled={creating}
          onSelect={startTopicChat}
        />
      </View>

      <View className={`mb-5 gap-3 ${isTablet ? 'flex-row' : 'flex-row'}`}>
        <View className="min-w-0 flex-1">
          <DailyGoalWidget goalMinutes={dailyGoal} completedMinutes={practiceMinutes} />
        </View>
        <View className="min-w-0 flex-1">
          <WordsSavedCard
            total={vocabStats?.total ?? 0}
            today={vocabStats?.createdToday ?? 0}
            error={statsError}
            onRetry={() => void loadStats()}
            onPress={() => navigation.navigate('Vocabulary')}
          />
        </View>
      </View>

      <WeeklyProgressCard
        data={weekly}
        loading={weeklyLoading}
        error={weeklyError}
        onRetry={() => void loadWeekly()}
      />

      <View
        className="mb-6 flex-row items-center gap-3.5 rounded-[22px] px-4 py-4"
        style={{ backgroundColor: colors.primarySoft }}>
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.surface }}>
          <Text className="text-lg">💡</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-brand">Learning Tip</Text>
          <Text className="mt-1 text-sm leading-5 text-ink-muted">{learningTip}</Text>
        </View>
      </View>

      {error ? (
        <View className="mb-4">
          <ErrorCard message={error} onRetry={load} />
        </View>
      ) : null}

      <View className="mb-3 flex-row items-center justify-between px-0.5">
        <Text className="text-lg font-extrabold text-ink">For You</Text>
        {forYouAll.length > 2 ? (
          <PressableScale
            onPress={() => setShowAllForYou(v => !v)}
            accessibilityLabel={showAllForYou ? 'Show fewer recommendations' : 'See all recommendations'}>
            <Text className="text-sm font-semibold text-brand">
              {showAllForYou ? 'Show less' : 'See all ›'}
            </Text>
          </PressableScale>
        ) : null}
      </View>

      {forYouItems.map(item => (
        <ForYouCard
          key={item.id}
          item={item}
          disabled={creating}
          onPress={() => onRecommendation(item)}
        />
      ))}

      <View className="mt-2">
        <RecentConversations
          conversations={otherConversations}
          currentTarget={languagePair.targetCode}
          onOpen={resumeConversation}
        />
      </View>
    </Screen>
  );
}
