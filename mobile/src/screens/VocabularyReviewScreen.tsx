import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as api from '../api/endpoints';
import type { VocabRating, VocabularyItem } from '../api/types';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { AppScreenHeader } from '../components/ui/AppScreenHeader';
import { ErrorCard } from '../components/ui/ErrorCard';
import { PressableScale } from '../components/ui/PressableScale';
import { SkeletonList } from '../components/ui/Shimmer';
import { getStreakDisplay } from '../services/streakStorage';
import type { RootStackParamList } from '../navigation/types';
import { softShadow } from '../theme/glass';
import { colors } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'VocabularyReview'>;

function newClientRequestId(): string {
  const cryptoApi = (
    globalThis as { crypto?: { randomUUID?: () => string } }
  ).crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const RATINGS: {
  key: VocabRating;
  label: string;
  hint: string;
  icon: string;
  bg: string;
  text: string;
  border: string;
}[] = [
  {
    key: 'again',
    label: 'Again',
    hint: 'Forgot',
    icon: '↺',
    bg: '#FEF2F2',
    text: colors.danger,
    border: '#FECACA',
  },
  {
    key: 'hard',
    label: 'Hard',
    hint: 'Tough',
    icon: '◇',
    bg: colors.tertiaryFixed,
    text: colors.onTertiaryFixedVariant,
    border: '#DDD6B8',
  },
  {
    key: 'good',
    label: 'Good',
    hint: 'OK',
    icon: '✓',
    bg: colors.primarySoft,
    text: colors.onPrimaryFixedVariant,
    border: '#C9C2F0',
  },
  {
    key: 'easy',
    label: 'Easy',
    hint: 'Knew it',
    icon: '★',
    bg: '#ECFDF5',
    text: '#047857',
    border: '#A7F3D0',
  },
];

export function VocabularyReviewScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user, settings } = useAuth();
  const language =
    route.params?.language ?? settings?.targetLanguage ?? undefined;

  const [queue, setQueue] = useState<VocabularyItem[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [doneCount, setDoneCount] = useState(0);
  const [streakLabel, setStreakLabel] = useState('Start today');
  const allowLeaveRef = useRef(false);
  const sessionIncompleteRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await api.fetchReviewQueue(language, 20);
      setQueue(items);
      setIndex(0);
      setRevealed(false);
      setDoneCount(0);
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [language]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    void getStreakDisplay(user?.id).then(setStreakLabel);
  }, [user?.id]);

  const current = queue[index] ?? null;
  const sessionIncomplete =
    !loading && queue.length > 0 && index < queue.length;
  sessionIncompleteRef.current = sessionIncomplete;

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (allowLeaveRef.current || !sessionIncompleteRef.current) return;
      e.preventDefault();
      Alert.alert(
        'Leave review?',
        'Ratings you already submitted are saved. Remaining cards stay due.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              allowLeaveRef.current = true;
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });
    return unsubscribe;
  }, [navigation]);

  const progress =
    queue.length === 0 ? 0 : Math.min(index, queue.length) / queue.length;
  const cardNumber = Math.min(index + 1, Math.max(queue.length, 1));
  const remaining = Math.max(queue.length - index, 0);
  const footerPad = Math.max(insets.bottom, 12) + 8;

  async function onRate(rating: VocabRating) {
    if (!current || submitting) return;
    setSubmitting(true);
    setError('');
    const clientRequestId = newClientRequestId();
    try {
      await api.submitVocabularyReview(current.id, { rating, clientRequestId });
      setDoneCount(n => n + 1);
      setRevealed(false);
      if (index + 1 >= queue.length) {
        setIndex(queue.length);
      } else {
        setIndex(i => i + 1);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const header = (
    <AppScreenHeader
      variant="back"
      title="Daily Review"
      subtitle={
        queue.length > 0 && current
          ? `Card ${cardNumber} of ${queue.length}`
          : 'Spaced repetition'
      }
      streakLabel={streakLabel}
      showAvatar={false}
      onBack={() => navigation.goBack()}
    />
  );

  if (loading) {
    return (
      <Screen scroll header={header}>
        <SkeletonList count={2} />
      </Screen>
    );
  }

  if (error && !current) {
    return (
      <Screen scroll header={header}>
        <ErrorCard message={error} onRetry={load} />
        <Button
          title="Back"
          variant="outline"
          className="mt-4"
          onPress={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  if (!current) {
    return (
      <Screen scroll header={header}>
        <View
          className="mt-4 overflow-hidden rounded-[28px] px-6 py-12"
          style={[
            {
              backgroundColor: colors.insight,
              borderWidth: 1,
              borderColor: colors.insightBorder,
            },
            softShadow(2),
          ]}>
          <View
            className="absolute -right-8 -top-10 h-36 w-36 rounded-full"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.14)' }}
          />
          <View className="items-center">
            <View
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.surface }}>
              <Text className="text-3xl">🎉</Text>
            </View>
            <Text className="mt-5 text-center text-3xl font-extrabold text-ink">
              Review complete
            </Text>
            <Text className="mt-3 text-center text-base leading-6 text-ink-muted">
              {doneCount > 0
                ? `You reviewed ${doneCount} word${doneCount === 1 ? '' : 's'}. Nice work keeping the streak alive.`
                : 'Nothing is due right now. Great timing.'}
            </Text>
          </View>
        </View>
        <Button
          title="Back to Words"
          className="mt-8"
          onPress={() => {
            allowLeaveRef.current = true;
            navigation.goBack();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen className="flex-1" header={header}>
      <View style={{ flex: 1, minHeight: 0 }}>
        {/* Progress strip */}
        <View className="mb-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-wide text-ink-muted">
              Session
            </Text>
            <Text className="text-xs font-semibold text-ink-muted">
              {remaining} left · {doneCount} done
            </Text>
          </View>
          <View
            className="h-2.5 overflow-hidden rounded-full"
            style={{ backgroundColor: colors.surfaceContainerHighest }}>
            <View
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: colors.secondary,
              }}
            />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: revealed ? 8 : 24,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View
            className="overflow-hidden rounded-[28px] px-5 py-8"
            style={[
              {
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderLight,
                minHeight: 320,
              },
              softShadow(3),
            ]}>
            <View
              className="absolute -right-10 -top-12 h-40 w-40 rounded-full"
              style={{
                backgroundColor: revealed
                  ? 'rgba(90, 77, 190, 0.08)'
                  : 'rgba(245, 158, 11, 0.1)',
              }}
            />

            <View className="items-center">
              <View
                className="mb-6 rounded-full px-3.5 py-1.5"
                style={{
                  backgroundColor: revealed ? colors.primarySoft : colors.phraseCard,
                }}>
                <Text
                  className="text-[11px] font-extrabold uppercase tracking-wider"
                  style={{
                    color: revealed ? colors.onPrimaryFixedVariant : colors.tertiary,
                  }}>
                  {revealed ? 'Answer revealed' : 'Recall first'}
                </Text>
              </View>

              <Text className="text-center text-[34px] font-extrabold leading-10 text-ink">
                {current.phrase}
              </Text>

              {revealed ? (
                <View className="mt-8 w-full">
                  <View
                    className="rounded-[20px] px-4 py-5"
                    style={{ backgroundColor: colors.primarySoft }}>
                    <Text className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-brand">
                      Meaning
                    </Text>
                    <Text className="text-center text-xl font-bold leading-7 text-ink">
                      {current.translation || current.note || 'No translation yet'}
                    </Text>
                  </View>
                  {current.pronunciation ? (
                    <Text className="mt-4 text-center text-sm font-medium text-ink-muted">
                      /{current.pronunciation}/
                    </Text>
                  ) : null}
                  {current.exampleSentence ? (
                    <View
                      className="mt-4 rounded-[16px] px-4 py-3"
                      style={{ backgroundColor: colors.surfaceContainerLow }}>
                      <Text className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        Example
                      </Text>
                      <Text className="text-center text-[15px] leading-6 text-ink-muted">
                        {current.exampleSentence}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <PressableScale
                  onPress={() => setRevealed(true)}
                  className="mt-10 w-full"
                  accessibilityLabel="Show answer">
                  <View
                    className="min-h-[56px] items-center justify-center rounded-full px-6"
                    style={[{ backgroundColor: colors.secondary }, softShadow(2)]}>
                    <Text className="text-base font-extrabold text-white">
                      Show answer
                    </Text>
                  </View>
                </PressableScale>
              )}
            </View>
          </View>

          {error ? (
            <View className="mt-3">
              <ErrorCard
                message={error}
                onRetry={() => {
                  setError('');
                }}
              />
            </View>
          ) : null}
        </ScrollView>

        {/* Sticky rating dock — never covers the flashcard content area */}
        {revealed ? (
          <View
            className="border-t bg-canvas pt-3"
            style={{
              paddingBottom: footerPad,
              borderColor: colors.borderLight,
            }}>
            <Text className="mb-3 text-center text-xs font-semibold text-ink-muted">
              How well did you know it?
            </Text>
            <View className="flex-row gap-2.5">
              {RATINGS.map(r => (
                <View key={r.key} style={{ flex: 1 }}>
                  <PressableScale
                    disabled={submitting}
                    onPress={() => void onRate(r.key)}
                    accessibilityLabel={`Rate ${r.label}`}>
                    <View
                      className="min-h-[72px] items-center justify-center rounded-[16px] px-1.5"
                      style={{
                        backgroundColor: r.bg,
                        borderWidth: 1,
                        borderColor: r.border,
                        opacity: submitting ? 0.55 : 1,
                      }}>
                      <Text className="text-base" style={{ color: r.text }}>
                        {r.icon}
                      </Text>
                      <Text
                        className="mt-1 text-[13px] font-extrabold"
                        style={{ color: r.text }}>
                        {r.label}
                      </Text>
                      <Text
                        className="mt-0.5 text-[10px] font-medium"
                        style={{ color: r.text, opacity: 0.8 }}>
                        {r.hint}
                      </Text>
                    </View>
                  </PressableScale>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
