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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as api from '../api/endpoints';
import type { VocabularyItem } from '../api/types';
import { getErrorMessage } from '../api/client';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { ErrorCard } from '../components/ui/ErrorCard';
import { PressableScale } from '../components/ui/PressableScale';
import { SkeletonList } from '../components/ui/Shimmer';
import { FluentAIBrand } from '../components/brand/FluentAILogo';
import { TutorAvatar } from '../components/brand/TutorAvatar';
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
    bg: '#ebe2c6',
    text: '#4c4732',
    label: 'Difficult',
  },
  new: {
    bg: colors.surfaceContainerHighest,
    text: colors.inkMuted,
    label: 'New',
  },
  mastered: {
    bg: colors.primarySoft,
    text: colors.accentDark,
    label: 'Mastered',
  },
};

function VocabHeader() {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();

  return (
    <View
      className="flex-row items-center justify-between bg-canvas"
      style={{
        marginTop: -(insets.top + 8),
        paddingTop: insets.top + 8,
        marginHorizontal: -horizontalPadding,
        paddingHorizontal: horizontalPadding,
        paddingBottom: 8,
      }}>
      <FluentAIBrand iconSize={40} />
      <Text className="text-sm font-bold text-brand">🔥 7 Days</Text>
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
      contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
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
                style={{ color: isActive ? colors.surface : colors.inkMuted }}>
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
  const status = getWordStatus(item);
  const badge = STATUS_STYLES[status];
  const subtitle = item.translation ?? item.note ?? 'Saved from tutoring';

  return (
    <PressableScale onPress={onPress}>
      <View
        className="mb-4 flex-row items-start justify-between rounded-[24px] p-4"
        style={[{ backgroundColor: colors.surface }, softShadow()]}>
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
            onSpeak();
          }}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colors.secondaryContainer}33` }}>
          <Text className="text-base" style={{ color: colors.secondary }}>
            🔊
          </Text>
        </Pressable>
      </View>
    </PressableScale>
  );
}

function AiInsightCard({ masteredCount, difficultCount }: { masteredCount: number; difficultCount: number }) {
  return (
    <View
      className="mb-4 flex-row items-center gap-4 rounded-[24px] p-4"
      style={{ backgroundColor: colors.insight }}>
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
        <Text className="text-xl">✨</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold" style={{ color: '#1f1c0a' }}>
          AI Learning Insight
        </Text>
        <Text className="mt-1 text-base leading-6" style={{ color: '#4c4732' }}>
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
      <Text className="mt-3 max-w-xs text-center text-base leading-6 text-ink-muted">
        Start your journey by exploring new lessons or adding phrases you want to learn.
      </Text>
      <Button
        title="Explore Lessons"
        variant="lavender"
        className="mt-8 w-full max-w-xs"
        onPress={onExplore}
      />
    </View>
  );
}

export function VocabularyScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { isTablet } = useResponsive();
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<VocabularyItem | null>(null);

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
    }, [load]),
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
      <View className="relative mt-6">
        <Text
          className="absolute left-4 top-[14px] z-10 text-lg"
          style={{ color: colors.inkMuted }}>
          🔍
        </Text>
        <TextInput
          className="h-[52px] rounded-full border pl-12 pr-6 text-base text-ink"
          style={{
            backgroundColor: colors.surfaceContainerLow,
            borderColor: colors.border,
          }}
          placeholder="Search your vocabulary..."
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FilterChipRow active={filter} onSelect={setFilter} />

      {error ? <ErrorCard message={error} onRetry={load} /> : null}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <Screen hasTabBar scroll header={<VocabHeader />}>
        {listHeader}
        <SkeletonList count={4} />
      </Screen>
    );
  }

  const showEmpty = items.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  return (
    <Screen hasTabBar className="flex-1" header={<VocabHeader />}>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <WordCard
            item={item}
            onPress={() => setSelected(item)}
            onSpeak={() => setSelected(item)}
          />
        )}
        ListHeaderComponent={listHeader}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'two-col' : 'one-col'}
        columnWrapperStyle={isTablet ? { gap: 16 } : undefined}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
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
            className="rounded-t-[32px] bg-surface p-6"
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
                <View className="mt-6 flex-row gap-2">
                  <Button title="Close" variant="outline" className="flex-1" onPress={() => setSelected(null)} />
                  <Button
                    title="Remove"
                    variant="danger"
                    className="flex-1"
                    onPress={() => void onDelete(selected.id)}
                  />
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
