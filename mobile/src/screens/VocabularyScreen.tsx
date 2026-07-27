import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as api from '../api/endpoints';
import type { VocabularyItem } from '../api/types';
import { getErrorMessage } from '../api/client';
import { useProfile } from '../hooks/useProfile';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { ErrorCard } from '../components/ui/ErrorCard';
import { PressableScale } from '../components/ui/PressableScale';
import { ProfileAvatar } from '../components/ui/ProfileAvatar';
import { SkeletonList } from '../components/ui/Shimmer';
import { StreakBadge } from '../components/ui/StreakBadge';
import { TutorAvatar } from '../components/brand/TutorAvatar';
import { getStreakDisplay } from '../services/streakStorage';
import type { MainTabParamList } from '../navigation/types';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/tokens';
import { softShadow } from '../theme/glass';

type FilterKey = 'all' | 'new' | 'mastered' | 'difficult';
type WordStatus = 'new' | 'mastered' | 'difficult';

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All Words' },
  { key: 'new', label: 'New' },
  { key: 'mastered', label: 'Mastered' },
  { key: 'difficult', label: 'Difficult' },
];

function getWordStatus(item: VocabularyItem): WordStatus {
  const ageDays =
    (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 7) return 'new';
  if (item.note && item.note.length > 0) return 'difficult';
  return 'mastered';
}

const STATUS_STYLES: Record<
  WordStatus,
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
  mastered: {
    bg: colors.primarySoft,
    text: colors.onPrimaryFixedVariant,
    label: 'Mastered',
  },
};

function VocabHeader({ streakLabel }: { streakLabel: string }) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { initials, avatarUri, resolvedName, reload } = useProfile();

  return (
    <View
      className="flex-row items-center justify-between gap-2 bg-canvas"
      style={{
        marginTop: -(insets.top + 8),
        paddingTop: insets.top + 8,
        marginHorizontal: -horizontalPadding,
        paddingHorizontal: horizontalPadding,
        paddingBottom: 8,
      }}>
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <ProfileAvatar
          uri={avatarUri}
          initials={initials}
          name={resolvedName}
          size="sm"
        />
        <Text className="text-2xl font-bold text-brand">FluentAI</Text>
      </View>
      <StreakBadge label={streakLabel} />
    </View>
  );
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
    <View className="relative mt-8 w-full">
      <Text
        className="absolute left-4 top-[14px] z-10 text-lg"
        style={{ color: colors.inkMuted }}>
        🔍
      </Text>
      <TextInput
        className="h-[52px] rounded-full border pl-12 pr-6 text-base text-ink"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          borderColor: focused ? `${colors.secondary}4D` : colors.border,
          borderWidth: focused ? 2 : 1,
        }}
        placeholder="Search your vocabulary..."
        placeholderTextColor={colors.inkFaint}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function FilterChipRow({
  active,
  onSelect,
}: {
  active: FilterKey;
  onSelect: (key: FilterKey) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
      className="mt-4">
      {FILTER_CHIPS.map(chip => {
        const isActive = active === chip.key;
        return (
          <PressableScale key={chip.key} onPress={() => onSelect(chip.key)}>
            <View
              className="rounded-full px-6 py-2"
              style={{
                backgroundColor: isActive ? colors.secondary : colors.surfaceContainer,
              }}>
              <Text
                className="text-sm font-bold"
                style={{ color: isActive ? colors.onSecondary : colors.inkMuted }}>
                {chip.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

function WordCard({
  item,
  onPress,
  onSpeak,
}: {
  item: VocabularyItem;
  onPress: () => void;
  onSpeak: () => void;
}) {
  const [speaking, setSpeaking] = useState(false);
  const status = getWordStatus(item);
  const badge = STATUS_STYLES[status];
  const subtitle = item.translation ?? item.note ?? 'Saved from tutoring';

  const handleSpeak = () => {
    setSpeaking(true);
    onSpeak();
    setTimeout(() => setSpeaking(false), 200);
  };

  return (
    <View className="mb-4 px-0.5 pt-1" style={{ overflow: 'visible' }}>
      <PressableScale onPress={onPress} style={{ overflow: 'visible' }}>
        <View
          className="flex-row items-start justify-between rounded-[24px] p-4"
          style={[{ backgroundColor: colors.surface }, softShadow(3)]}>
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-ink">{item.phrase}</Text>
            <Text className="mt-1 text-base text-ink-muted" numberOfLines={2}>
              {subtitle}
            </Text>
            <View
              className="mt-3 self-start rounded-full px-3 py-1"
              style={{ backgroundColor: badge.bg }}>
              <Text className="text-xs font-medium" style={{ color: badge.text }}>
                {badge.label}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={e => {
              e.stopPropagation?.();
              handleSpeak();
            }}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: speaking ? colors.accentPill : `${colors.secondaryContainer}33`,
            }}>
            <Text
              className="text-base"
              style={{ color: speaking ? colors.onSecondaryContainer : colors.secondary }}>
              🔊
            </Text>
          </Pressable>
        </View>
      </PressableScale>
    </View>
  );
}

function AiInsightCard({
  masteredCount,
  difficultCount,
  fullWidth,
}: {
  masteredCount: number;
  difficultCount: number;
  fullWidth?: boolean;
}) {
  return (
    <View
      className={`mb-4 flex-row items-center gap-4 rounded-[24px] p-4 ${fullWidth ? 'w-full' : ''}`}
      style={{ backgroundColor: colors.insight }}>
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
        <Text className="text-xl">✨</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold" style={{ color: colors.onTertiaryFixed }}>
          AI Learning Insight
        </Text>
        <Text className="mt-1 text-base leading-6" style={{ color: colors.onTertiaryFixedVariant }}>
          {masteredCount > 0
            ? `You've mastered ${masteredCount} word${masteredCount === 1 ? '' : 's'} this week! Try focusing on your 'Difficult' list to maintain your streak.`
            : difficultCount > 0
              ? `You have ${difficultCount} difficult word${difficultCount === 1 ? '' : 's'} to review. Keep practicing to master them!`
              : 'Save phrases from chat corrections to build your personal vocabulary list.'}
        </Text>
      </View>
    </View>
  );
}

function VocabEmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <View className="items-center px-4 py-12">
      <View
        className="mb-8 h-48 w-48 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: colors.surfaceContainer }}>
        <TutorAvatar size="lg" />
      </View>
      <Text className="text-center text-[32px] font-bold text-ink">No words yet?</Text>
      <Text className="mt-2 max-w-xs text-center text-base leading-6 text-ink-muted">
        Start your journey by exploring new lessons or adding phrases you want to learn.
      </Text>
      <PressableScale onPress={onExplore} className="mt-8 w-full max-w-xs">
        <View
          className="h-[52px] items-center justify-center rounded-full px-8"
          style={{ backgroundColor: colors.secondary }}>
          <Text className="text-sm font-bold" style={{ color: colors.onSecondary }}>
            Explore Lessons
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

export function VocabularyScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const { reload } = useProfile();
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<VocabularyItem | null>(null);
  const [streakLabel, setStreakLabel] = useState('Start today');

  const load = useCallback(async () => {
    try {
      const list = await api.fetchVocabulary();
      setItems(list);
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
      void reload();
      void getStreakDisplay().then(setStreakLabel);
    }, [load, reload]),
  );

  const filtered = useMemo(() => {
    let list = [...items];
    if (filter !== 'all') {
      list = list.filter(item => getWordStatus(item) === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        i =>
          i.phrase.toLowerCase().includes(q) ||
          (i.translation?.toLowerCase().includes(q) ?? false) ||
          (i.note?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [items, query, filter]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const masteredCount = items.filter(
      i => getWordStatus(i) === 'mastered' && new Date(i.createdAt).getTime() >= weekAgo,
    ).length;
    const difficultCount = items.filter(i => getWordStatus(i) === 'difficult').length;
    return { masteredCount, difficultCount };
  }, [items]);

  async function onDelete(id: string) {
    try {
      await api.deleteVocabularyItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setSelected(null);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const listHeader = (
    <View className="pb-2">
      <SearchBar value={query} onChangeText={setQuery} />
      <FilterChipRow active={filter} onSelect={setFilter} />
      {error ? <ErrorCard message={error} onRetry={load} /> : null}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <Screen hasTabBar scroll header={<VocabHeader streakLabel={streakLabel} />}>
        {listHeader}
        <SkeletonList count={4} />
      </Screen>
    );
  }

  const showEmpty = items.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  return (
    <Screen hasTabBar className="flex-1" header={<VocabHeader streakLabel={streakLabel} />}>
      <FlatList
        style={{ overflow: 'visible' }}
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={isTablet ? { flex: 1, overflow: 'visible' } : { overflow: 'visible' }}>
            <WordCard
              item={item}
              onPress={() => setSelected(item)}
              onSpeak={() => setSelected(item)}
            />
          </View>
        )}
        ListHeaderComponent={listHeader}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'two-col' : 'one-col'}
        columnWrapperStyle={isTablet ? { gap: 16, overflow: 'visible' } : undefined}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 4, paddingBottom: 16, overflow: 'visible' }}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
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
        ListFooterComponent={
          filtered.length > 0 ? (
            <AiInsightCard
              masteredCount={stats.masteredCount}
              difficultCount={stats.difficultCount}
              fullWidth={isTablet}
            />
          ) : null
        }
        ListEmptyComponent={
          showEmpty ? (
            <VocabEmptyState onExplore={() => navigation.navigate('Practice')} />
          ) : showNoResults ? (
            <View className="items-center py-12">
              <Text className="text-xl font-bold text-ink">No matches found</Text>
              <Text className="mt-2 text-center text-base text-ink-muted">
                Try a different search term or filter.
              </Text>
            </View>
          ) : null
        }
      />

      <Modal visible={Boolean(selected)} transparent animationType="slide">
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(27,28,27,0.4)' }}
          onPress={() => setSelected(null)}>
          <Pressable
            className="rounded-t-[32px] bg-surface px-6 pt-6"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            onPress={e => e.stopPropagation()}>
            {selected ? (
              <>
                <Text className="text-xs font-bold uppercase text-ink-faint">Phrase</Text>
                <Text className="mt-2 text-2xl font-extrabold text-ink">{selected.phrase}</Text>
                {selected.translation ? (
                  <Text className="mt-2 text-lg text-ink-muted">{selected.translation}</Text>
                ) : null}
                {selected.note ? (
                  <Text className="mt-4 text-base leading-6 text-ink-muted">{selected.note}</Text>
                ) : null}
                <View
                  className="mt-4 self-start rounded-full px-3 py-1"
                  style={{ backgroundColor: STATUS_STYLES[getWordStatus(selected)].bg }}>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: STATUS_STYLES[getWordStatus(selected)].text }}>
                    {STATUS_STYLES[getWordStatus(selected)].label}
                  </Text>
                </View>
                <View className="mt-6 flex-row items-stretch gap-3">
                  <View className="min-w-0 flex-1">
                    <Button
                      title="Cancel"
                      variant="outline"
                      className="w-full"
                      onPress={() => setSelected(null)}
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Button
                      title="Remove"
                      variant="danger"
                      className="w-full"
                      onPress={() => void onDelete(selected.id)}
                    />
                  </View>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
