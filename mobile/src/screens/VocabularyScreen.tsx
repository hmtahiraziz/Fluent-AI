import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as api from '../api/endpoints';
import type { LearningState, VocabularyItem, VocabularyStats } from '../api/types';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { Screen } from '../components/Screen';
import { AppScreenHeader } from '../components/ui/AppScreenHeader';
import { ErrorCard } from '../components/ui/ErrorCard';
import { PressableScale } from '../components/ui/PressableScale';
import { PremiumEmptyState } from '../components/ui/PremiumEmptyState';
import { SkeletonList } from '../components/ui/Shimmer';
import { getStreakDisplay } from '../services/streakStorage';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useResponsive } from '../hooks/useResponsive';
import { languageMeta } from '../config/constants';
import { colors } from '../theme/tokens';
import { softShadow } from '../theme/glass';

type FilterKey = 'all' | LearningState;
type SortKey = 'created_at' | 'phrase' | 'next_review_at';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Vocabulary'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'created_at', label: 'Newest' },
  { key: 'phrase', label: 'A–Z' },
  { key: 'next_review_at', label: 'Due soon' },
];

const STATUS_STYLES: Record<
  LearningState,
  { bg: string; text: string; label: string }
> = {
  difficult: {
    bg: colors.tertiaryFixed,
    text: colors.onTertiaryFixedVariant,
    label: 'Difficult',
  },
  new: {
    bg: colors.surfaceContainerHighest,
    text: colors.inkMuted,
    label: 'New',
  },
  learning: {
    bg: colors.secondaryContainer,
    text: colors.onSecondaryContainer,
    label: 'Learning',
  },
  review: {
    bg: colors.primarySoft,
    text: colors.onPrimaryFixedVariant,
    label: 'Review',
  },
  mastered: {
    bg: colors.primarySoft,
    text: colors.onPrimaryFixedVariant,
    label: 'Mastered',
  },
};

function wordState(item: VocabularyItem): LearningState {
  return item.learningState ?? 'new';
}

function formatAddedLabel(iso: string): string {
  const created = new Date(iso).getTime();
  const diff = Date.now() - created;
  const dayMs = 24 * 60 * 60 * 1000;
  if (diff < dayMs) return 'Added today';
  const days = Math.floor(diff / dayMs);
  if (days === 1) return 'Added yesterday';
  if (days < 7) return `Added ${days} days ago`;
  return `Added ${new Date(iso).toLocaleDateString()}`;
}

function formatNextReview(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const next = new Date(iso);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startNext = new Date(next);
  startNext.setHours(0, 0, 0, 0);
  const days = Math.round((startNext.getTime() - startToday.getTime()) / 86400000);
  if (days <= 0) return 'Due now';
  if (days === 1) return 'Next review tomorrow';
  return `Next review in ${days} days`;
}

function SearchBar({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="relative mt-3 w-full">
      <Text
        className="absolute left-4 top-[14px] z-10 text-lg"
        style={{ color: colors.inkMuted }}
        accessible={false}>
        🔍
      </Text>
      <TextInput
        className="h-[52px] rounded-full border pl-12 pr-6 text-base text-ink"
        style={{
          backgroundColor: colors.surface,
          borderColor: focused ? `${colors.secondary}4D` : colors.borderLight,
          borderWidth: focused ? 2 : 1,
        }}
        placeholder="Search your vocabulary..."
        placeholderTextColor={colors.inkFaint}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Search vocabulary"
        accessibilityRole="search"
      />
    </View>
  );
}

function WordCard({
  item,
  onPress,
}: {
  item: VocabularyItem;
  onPress: () => void;
}) {
  const status = wordState(item);
  const badge = STATUS_STYLES[status];
  const nextLabel = formatNextReview(item.nextReviewAt);
  const isPhrase = item.phrase.trim().includes(' ');
  const metaLine = [
    item.pronunciation ? `/${item.pronunciation}/` : null,
    isPhrase ? 'phrase' : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const a11yBits = [
    item.phrase,
    badge.label,
    item.translation ? `Translation ${item.translation}` : null,
    nextLabel ?? formatAddedLabel(item.createdAt),
  ].filter(Boolean);

  return (
    <View className="mb-3">
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yBits.join(', ')}>
        <View
          className="rounded-[20px] px-4 py-3.5"
          style={[
            {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderLight,
            },
            softShadow(1),
          ]}>
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="min-w-0 flex-1 text-[19px] font-extrabold text-ink"
              numberOfLines={2}>
              {item.phrase}
            </Text>
          </View>

          <View className="mt-1.5 flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              {metaLine ? (
                <Text className="text-xs text-ink-muted" numberOfLines={1}>
                  {metaLine}
                </Text>
              ) : null}
            </View>
            {item.translation ? (
              <Text
                className="max-w-[42%] text-right text-[15px] font-semibold text-ink"
                numberOfLines={2}>
                {item.translation}
              </Text>
            ) : null}
          </View>

          {item.note ? (
            <View
              className="mt-3 rounded-xl px-3 py-2.5"
              style={{ backgroundColor: '#F3F4F6' }}>
              <Text className="text-[10px] font-extrabold uppercase tracking-wider text-ink-faint">
                Grammar note
              </Text>
              <Text className="mt-1 text-sm leading-5 text-ink-muted" numberOfLines={3}>
                {item.note}
              </Text>
            </View>
          ) : null}

          <View className="mt-3 flex-row items-center justify-between">
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: badge.bg }}>
              <Text className="text-[11px] font-bold" style={{ color: badge.text }}>
                {badge.label}
              </Text>
            </View>
            <Text
              className="text-xs font-semibold"
              style={{
                color: nextLabel ? colors.secondary : colors.inkMuted,
              }}>
              {nextLabel ?? formatAddedLabel(item.createdAt)} ›
            </Text>
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

export function VocabularyScreen() {
  const navigation = useNavigation<Nav>();
  const { isTablet } = useResponsive();
  const { user, settings } = useAuth();
  const { reload } = useProfile();
  const targetCode = settings?.targetLanguage ?? 'es';
  const languageLabel = languageMeta(targetCode).label;

  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('created_at');
  const [streakLabel, setStreakLabel] = useState('Start today');
  const requestIdRef = useRef(0);
  const hasDataRef = useRef(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const load = useCallback(
    async (opts?: { pull?: boolean; cursor?: string }) => {
      const requestId = ++requestIdRef.current;
      const showPull = Boolean(opts?.pull);
      const appending = Boolean(opts?.cursor);
      if (showPull) setRefreshing(true);
      else if (hasDataRef.current && !appending) setRefreshing(true);
      if (appending) setLoadingMore(true);

      try {
        const [page, nextStats] = await Promise.all([
          api.fetchVocabulary(targetCode, {
            limit: 100,
            sort,
            state: filter === 'all' ? undefined : filter,
            q: debouncedQuery || undefined,
            cursor: opts?.cursor,
          }),
          appending
            ? Promise.resolve(null)
            : api.fetchVocabularyStats(targetCode),
        ]);
        if (requestId !== requestIdRef.current) return;
        setItems(prev => (appending ? [...prev, ...page.items] : page.items));
        setNextCursor(page.nextCursor ?? null);
        if (nextStats) setStats(nextStats);
        hasDataRef.current = true;
        setError('');
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        setError(getErrorMessage(e));
      } finally {
        if (requestId === requestIdRef.current) {
          setInitialLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [targetCode, sort, filter, debouncedQuery],
  );

  // Refetch when filter / sort / search change (while screen stays focused).
  useEffect(() => {
    if (!hasDataRef.current) return;
    setNextCursor(null);
    void load({ pull: true });
  }, [filter, sort, debouncedQuery, load]);

  useFocusEffect(
    useCallback(() => {
      void load();
      void reload();
      void getStreakDisplay(user?.id).then(setStreakLabel);
    }, [load, reload, user?.id]),
  );

  function selectFilter(next: FilterKey) {
    if (next === filter) return;
    setFilter(next);
  }

  function selectSort(next: SortKey) {
    if (next === sort) return;
    setSort(next);
  }

  const header = (
    <AppScreenHeader
      title={`Words · ${languageLabel}`}
      streakLabel={streakLabel}
      onAvatarPress={() => navigation.navigate('Settings')}
    />
  );

  const STAT_FILTERS: { key: FilterKey; label: string; count: number }[] = stats
    ? [
        { key: 'all', label: 'ALL', count: stats.total },
        { key: 'new', label: 'NEW', count: stats.byState.new ?? 0 },
        { key: 'learning', label: 'LEARNING', count: stats.byState.learning ?? 0 },
        { key: 'review', label: 'REVIEW', count: stats.byState.review ?? 0 },
        { key: 'difficult', label: 'DIFFICULT', count: stats.byState.difficult ?? 0 },
        { key: 'mastered', label: 'MASTERED', count: stats.byState.mastered ?? 0 },
      ]
    : [];

  const listHeader = (
    <View className="pb-1">
      {stats ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          {STAT_FILTERS.map(card => {
            const isActive = filter === card.key;
            return (
              <PressableScale
                key={card.key}
                onPress={() => selectFilter(card.key)}
                accessibilityLabel={`${card.label}, ${card.count}`}
                accessibilityState={{ selected: isActive }}>
                <View
                  className="min-w-[72px] items-center rounded-[16px] px-3 py-2.5"
                  style={{
                    backgroundColor: isActive ? colors.primarySoft : colors.surface,
                    borderWidth: 1.5,
                    borderColor: isActive ? colors.secondary : colors.borderLight,
                  }}>
                  <Text
                    className="text-[10px] font-bold tracking-wide"
                    style={{ color: isActive ? colors.secondary : colors.inkMuted }}>
                    {card.label}
                  </Text>
                  <Text
                    className="mt-0.5 text-lg font-extrabold"
                    style={{ color: isActive ? colors.primaryDark : colors.ink }}>
                    {card.count}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      ) : null}

      {stats && stats.dueCount > 0 ? (
        <PressableScale
          onPress={() =>
            navigation.navigate('VocabularyReview', { language: targetCode })
          }
          className="mb-3 mt-2"
          accessibilityLabel={`Start daily review, ${stats.dueCount} words due`}>
          <View
            className="overflow-hidden rounded-[24px]"
            style={[
              {
                backgroundColor: colors.insight,
                borderWidth: 1,
                borderColor: colors.insightBorder,
              },
              softShadow(2),
            ]}>
            <View
              className="absolute -right-6 -top-8 h-28 w-28 rounded-full"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}
            />
            <View
              className="absolute -bottom-10 -left-4 h-24 w-24 rounded-full"
              style={{ backgroundColor: 'rgba(69, 62, 127, 0.06)' }}
            />
            <View className="flex-row items-center gap-3.5 p-4">
              <View
                className="h-14 w-14 items-center justify-center rounded-[18px]"
                style={{ backgroundColor: colors.surface }}>
                <Text className="text-2xl">📚</Text>
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-ink">
                    Daily Review
                  </Text>
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: colors.gold }}>
                    <Text className="text-[10px] font-extrabold text-white">
                      {stats.dueCount} due
                    </Text>
                  </View>
                </View>
                <Text className="mt-1 text-[15px] font-semibold leading-5 text-ink">
                  Keep your streak sharp
                </Text>
                <Text className="mt-0.5 text-sm text-ink-muted">
                  {stats.dueCount === 1
                    ? '1 word is ready for review'
                    : `${stats.dueCount} words ready for review`}
                </Text>
              </View>
              <View
                className="h-11 min-w-[44px] items-center justify-center rounded-full px-3.5"
                style={{ backgroundColor: colors.secondary }}>
                <Text className="text-sm font-extrabold text-white">Start</Text>
              </View>
            </View>
          </View>
        </PressableScale>
      ) : stats ? (
        <View
          className="mb-3 mt-2 flex-row items-center gap-3 rounded-[20px] px-4 py-3.5"
          style={{ backgroundColor: colors.primarySoft }}>
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.surface }}>
            <Text className="text-base">✓</Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-brand">You're caught up</Text>
            <Text className="mt-0.5 text-xs text-ink-muted">
              No words due — come back tomorrow.
            </Text>
          </View>
        </View>
      ) : null}

      <SearchBar value={query} onChangeText={setQuery} />

      <View className="mb-2 mt-2 flex-row flex-wrap gap-2">
        {SORT_OPTIONS.map(opt => {
          const isActive = sort === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => selectSort(opt.key)}
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${opt.label}`}
              accessibilityState={{ selected: isActive }}
              className="rounded-full px-3 py-1.5"
              style={{
                backgroundColor: isActive
                  ? colors.primarySoft
                  : colors.surfaceContainerLow,
              }}>
              <Text
                className="text-xs font-semibold"
                style={{
                  color: isActive ? colors.onPrimaryFixedVariant : colors.inkMuted,
                }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

    </View>
  );

  if (initialLoading) {
    return (
      <Screen hasTabBar scroll header={header}>
        {listHeader}
        <SkeletonList count={4} />
      </Screen>
    );
  }

  const showEmpty =
    !error &&
    items.length === 0 &&
    !debouncedQuery &&
    filter === 'all';
  const showNoResults = !error && !showEmpty && items.length === 0;

  return (
    <Screen hasTabBar className="flex-1" header={header}>
      <View style={{ flex: 1, minHeight: 0 }}>
        {error ? (
          <View className="mb-2">
            <ErrorCard message={error} onRetry={() => void load()} />
          </View>
        ) : null}
        <FlatList
          style={{ flex: 1 }}
          data={items}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={isTablet ? { flex: 1 } : undefined}>
              <WordCard
                item={item}
                onPress={() => navigation.navigate('VocabularyDetail', { id: item.id })}
              />
            </View>
          )}
          ListHeaderComponent={listHeader}
          ListFooterComponent={
            loadingMore ? (
              <Text className="py-3 text-center text-sm text-ink-muted">Loading more…</Text>
            ) : null
          }
          numColumns={isTablet ? 2 : 1}
          key={`${isTablet ? 'two' : 'one'}-${filter}-${sort}-${debouncedQuery}`}
          columnWrapperStyle={isTablet ? { gap: 12 } : undefined}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 4,
            paddingBottom: 16,
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void load({ pull: true });
              }}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (!nextCursor || loadingMore) return;
            void load({ cursor: nextCursor });
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            showEmpty ? (
              <PremiumEmptyState
                title="No words yet"
                subtitle="Save phrases from chat corrections and tutor suggestions to build your list."
                actionLabel="Start practicing"
                onAction={() => navigation.navigate('Practice')}
              />
            ) : showNoResults ? (
              <View className="items-center py-12">
                <Text className="text-xl font-bold text-ink">No matches found</Text>
                <Text className="mt-2 text-center text-base text-ink-muted">
                  Try a different search term or filter.
                </Text>
                {filter !== 'all' ? (
                  <PressableScale onPress={() => selectFilter('all')} className="mt-4">
                    <View
                      className="rounded-full px-4 py-2"
                      style={{ backgroundColor: colors.primarySoft }}>
                      <Text className="text-sm font-bold text-brand">Show all words</Text>
                    </View>
                  </PressableScale>
                ) : null}
              </View>
            ) : null
          }
        />
      </View>
    </Screen>
  );
}
