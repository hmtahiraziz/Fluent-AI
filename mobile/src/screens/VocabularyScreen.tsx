import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as api from '../api/endpoints';
import type { VocabularyItem } from '../api/types';
import { getErrorMessage } from '../api/client';
import { languageMeta } from '../config/constants';
import { Button } from '../components/Button';
import { ErrorCard } from '../components/ui/ErrorCard';
import { GlassCard } from '../components/ui/GlassCard';
import { PremiumEmptyState } from '../components/ui/PremiumEmptyState';
import { PressableScale } from '../components/ui/PressableScale';
import { PromptChip } from '../components/ui/PromptChip';
import { SkeletonList } from '../components/ui/Shimmer';
import { SplitHeadline } from '../components/ui/SplitHeadline';
import { Screen } from '../components/Screen';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/tokens';

type FilterKey = 'all' | 'recent';

export function VocabularyScreen() {
  const { isTablet } = useResponsive();
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
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
    if (filter === 'recent') {
      list = list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
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

  async function onDelete(id: string) {
    try {
      await api.deleteVocabularyItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setSelected(null);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  function toggleFavorite(id: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderItem({ item }: { item: VocabularyItem }) {
    const meta = languageMeta(item.language);
    const isFav = favorites.has(item.id);
    return (
      <View className={isTablet ? 'mb-3 flex-1' : 'mb-3'}>
        <PressableScale onPress={() => setSelected(item)}>
          <GlassCard tint={isFav ? 'lavender' : 'default'}>
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-ink-muted">
                  {meta.flag} {meta.label}
                </Text>
                <View className="rounded-full bg-brand/10 px-2 py-0.5">
                  <Text className="text-xs font-bold text-brand">Saved</Text>
                </View>
              </View>
              <Pressable onPress={() => toggleFavorite(item.id)} className="px-2 py-1">
                <Text className="text-lg">{isFav ? '★' : '☆'}</Text>
              </Pressable>
            </View>
            <Text className="text-xl font-extrabold text-ink">{item.phrase}</Text>
            {item.translation ? (
              <Text className="mt-1 text-base text-ink-muted">{item.translation}</Text>
            ) : null}
            {item.note ? (
              <Text className="mt-2 text-sm leading-5 text-ink-muted" numberOfLines={2}>
                {item.note}
              </Text>
            ) : null}
            <View className="mt-3 flex-row gap-2">
              <Pressable className="rounded-full bg-mist px-3 py-1.5">
                <Text className="text-xs font-semibold text-ink-muted">🔊 Pronounce</Text>
              </Pressable>
              <Pressable
                onPress={() => onDelete(item.id)}
                className="rounded-full bg-coral/10 px-3 py-1.5">
                <Text className="text-xs font-bold text-coral">Remove</Text>
              </Pressable>
            </View>
          </GlassCard>
        </PressableScale>
      </View>
    );
  }

  const listHeader = (
    <View className="pb-4 pt-2">
      <SplitHeadline primary="Your" accent="words" />
      <Text className="mt-2 text-base leading-6 text-ink-muted">
        Phrases saved from tutor corrections.
      </Text>
      <TextInput
        className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3 text-base text-ink"
        placeholder="Search vocabulary…"
        placeholderTextColor={colors.inkFaint}
        value={query}
        onChangeText={setQuery}
      />
      <View className="mt-3 flex-row flex-wrap gap-2">
        <PromptChip label="All words" onPress={() => setFilter('all')} />
        <PromptChip label="Recent" onPress={() => setFilter('recent')} />
      </View>
      {error ? <ErrorCard message={error} onRetry={load} /> : null}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <Screen hasTabBar scroll>
        {listHeader}
        <SkeletonList count={4} />
      </Screen>
    );
  }

  return (
    <Screen hasTabBar className="flex-1">
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'two-col' : 'one-col'}
        columnWrapperStyle={isTablet ? { gap: 12 } : undefined}
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
        ListEmptyComponent={
          <PremiumEmptyState
            title="No saved phrases yet"
            subtitle='Tap "Save vocabulary" on a correction in chat to build your list.'
          />
        }
      />

      <Modal visible={Boolean(selected)} transparent animationType="slide">
        <Pressable
          className="flex-1 justify-end bg-ink/40"
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
                <View className="mt-6 flex-row gap-2">
                  <Button title="Copy" variant="outline" className="flex-1" onPress={() => setSelected(null)} />
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
