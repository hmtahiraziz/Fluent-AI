import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as api from '../api/endpoints';
import type { LearningState, VocabularyItem, VocabularySource } from '../api/types';
import { getErrorMessage } from '../api/client';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { AppScreenHeader } from '../components/ui/AppScreenHeader';
import { ErrorCard } from '../components/ui/ErrorCard';
import { SkeletonList } from '../components/ui/Shimmer';
import { getStreakDisplay } from '../services/streakStorage';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'VocabularyDetail'>;

const STATUS_LABEL: Record<LearningState, string> = {
  new: 'New',
  learning: 'Learning',
  review: 'Review',
  difficult: 'Difficult',
  mastered: 'Mastered',
};

const MAX_SHORT = 500;
const MAX_LONG = 2000;

type FieldErrors = {
  translation?: string;
  pronunciation?: string;
  exampleSentence?: string;
  note?: string;
};

function formatReviewDate(iso: string | null | undefined, empty: string): string {
  if (!iso) return empty;
  return new Date(iso).toLocaleString();
}

export function VocabularyDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [item, setItem] = useState<VocabularyItem | null>(null);
  const [source, setSource] = useState<VocabularySource | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [undoId, setUndoId] = useState<string | null>(null);
  const [streakLabel, setStreakLabel] = useState('Start today');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [translation, setTranslation] = useState('');
  const [note, setNote] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [baseline, setBaseline] = useState({
    translation: '',
    note: '',
    pronunciation: '',
    exampleSentence: '',
  });
  const allowLeaveRef = useRef(false);
  const isDirtyRef = useRef(false);
  const persistRef = useRef<() => Promise<boolean>>(async () => false);

  const isDirty =
    !undoId &&
    item != null &&
    (translation !== baseline.translation ||
      note !== baseline.note ||
      pronunciation !== baseline.pronunciation ||
      exampleSentence !== baseline.exampleSentence);
  isDirtyRef.current = isDirty;

  const applyItem = useCallback((next: VocabularyItem) => {
    const t = next.translation ?? '';
    const n = next.note ?? '';
    const p = next.pronunciation ?? '';
    const e = next.exampleSentence ?? '';
    setItem(next);
    setTranslation(t);
    setNote(n);
    setPronunciation(p);
    setExampleSentence(e);
    setBaseline({ translation: t, note: n, pronunciation: p, exampleSentence: e });
    setFieldErrors({});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchVocabularyItem(id);
      applyItem(data.item);
      setSource(data.source);
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id, applyItem]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    void getStreakDisplay(user?.id).then(setStreakLabel);
  }, [user?.id]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (allowLeaveRef.current || !isDirtyRef.current) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'You have unsaved edits on this word.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            allowLeaveRef.current = true;
            navigation.dispatch(e.data.action);
          },
        },
        {
          text: 'Save',
          onPress: () => {
            void (async () => {
              const ok = await persistRef.current();
              if (ok) {
                allowLeaveRef.current = true;
                navigation.dispatch(e.data.action);
              }
            })();
          },
        },
      ]);
    });
    return unsubscribe;
  }, [navigation]);

  const persist = useCallback(async (): Promise<boolean> => {
    const nextErrors: FieldErrors = {};
    if (translation.length > MAX_SHORT) {
      nextErrors.translation = `Max ${MAX_SHORT} characters`;
    }
    if (pronunciation.length > MAX_SHORT) {
      nextErrors.pronunciation = `Max ${MAX_SHORT} characters`;
    }
    if (exampleSentence.length > MAX_LONG) {
      nextErrors.exampleSentence = `Max ${MAX_LONG} characters`;
    }
    if (note.length > MAX_LONG) {
      nextErrors.note = `Max ${MAX_LONG} characters`;
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return false;

    setSaving(true);
    try {
      const updated = await api.updateVocabularyItem(id, {
        translation: translation.trim() || null,
        note: note.trim() || null,
        pronunciation: pronunciation.trim() || null,
        exampleSentence: exampleSentence.trim() || null,
      });
      applyItem(updated);
      setError('');
      return true;
    } catch (e) {
      setError(getErrorMessage(e));
      return false;
    } finally {
      setSaving(false);
    }
  }, [id, translation, note, pronunciation, exampleSentence, applyItem]);

  persistRef.current = persist;

  async function onSave() {
    await persist();
  }

  function onDelete() {
    if (undoId) return;
    Alert.alert('Remove word?', 'You can undo for a few seconds after removing.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await api.deleteVocabularyItem(id);
              setUndoId(id);
              setTimeout(() => {
                setUndoId(current => {
                  if (current === id) {
                    allowLeaveRef.current = true;
                    navigation.goBack();
                  }
                  return null;
                });
              }, 5000);
            } catch (e) {
              setError(getErrorMessage(e));
            }
          })();
        },
      },
    ]);
  }

  async function onUndo() {
    if (!undoId) return;
    try {
      await api.restoreVocabularyItem(undoId);
      setUndoId(null);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const header = (
    <AppScreenHeader
      variant="back"
      title="Phrase"
      subtitle="Word details"
      streakLabel={streakLabel}
      showAvatar={false}
      onBack={() => navigation.goBack()}
    />
  );

  if (loading) {
    return (
      <Screen scroll header={header}>
        <SkeletonList count={3} />
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen scroll header={header}>
        <ErrorCard message={error || 'Word not found'} onRetry={load} />
        <Button
          title="Back"
          variant="outline"
          className="mt-4"
          onPress={() => {
            allowLeaveRef.current = true;
            navigation.goBack();
          }}
        />
      </Screen>
    );
  }

  const state = (item.learningState ?? 'new') as LearningState;
  const fieldsLocked = Boolean(undoId);

  return (
    <Screen className="flex-1" header={header}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 24) + 96,
          paddingTop: 4,
        }}
        keyboardShouldPersistTaps="handled">
        <View
          className="mb-5 overflow-hidden rounded-[28px] p-5"
          style={{ backgroundColor: colors.insight }}>
          <Text className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Phrase
          </Text>
          <Text className="mt-2 text-[32px] font-extrabold leading-9 text-ink">
            {item.phrase}
          </Text>
          <View
            className="mt-3 self-start rounded-full px-3 py-1"
            style={{ backgroundColor: colors.surface }}>
            <Text className="text-xs font-bold" style={{ color: colors.onPrimaryFixedVariant }}>
              {STATUS_LABEL[state]}
            </Text>
          </View>
        </View>

        {error ? (
          <View className="mb-4">
            <ErrorCard message={error} onRetry={load} />
          </View>
        ) : null}

        <Field
          label="Translation"
          value={translation}
          onChangeText={setTranslation}
          placeholder="Add a translation"
          error={fieldErrors.translation}
          editable={!fieldsLocked}
        />
        <Field
          label="Pronunciation"
          value={pronunciation}
          onChangeText={setPronunciation}
          placeholder="IPA or phonetic hint"
          error={fieldErrors.pronunciation}
          editable={!fieldsLocked}
        />
        <Field
          label="Example"
          value={exampleSentence}
          onChangeText={setExampleSentence}
          placeholder="Example sentence"
          multiline
          error={fieldErrors.exampleSentence}
          editable={!fieldsLocked}
        />
        <Field
          label="Notes"
          value={note}
          onChangeText={setNote}
          placeholder="Personal notes"
          multiline
          error={fieldErrors.note}
          editable={!fieldsLocked}
        />

        <View
          className="mt-6 rounded-[22px] p-4"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}>
          <Text className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
            Learning
          </Text>
          <Text className="mt-2 text-sm text-ink-muted">Status</Text>
          <Text className="text-base font-semibold text-ink">{STATUS_LABEL[state]}</Text>
          <Text className="mt-3 text-sm text-ink-muted">Next review</Text>
          <Text className="text-base font-semibold text-ink">
            {formatReviewDate(item.nextReviewAt, 'Not scheduled')}
          </Text>
          <Text className="mt-3 text-sm text-ink-muted">Last reviewed</Text>
          <Text className="text-base font-semibold text-ink">
            {formatReviewDate(item.lastReviewedAt, 'Never')}
          </Text>
          <Text className="mt-3 text-sm text-ink-muted">Added</Text>
          <Text className="text-base font-semibold text-ink">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>

        {source ? (
          <View
            className="mt-4 rounded-[22px] p-4"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}>
            <Text className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              Source conversation
            </Text>
            <Text className="mt-1 text-base font-extrabold text-ink">
              {source.title ?? 'Practice chat'}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-ink-muted" numberOfLines={4}>
              {source.excerpt}
            </Text>
            <Button
              title="Open chat"
              variant="outline"
              className="mt-3"
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: source.conversationId,
                  title: source.title ?? undefined,
                })
              }
            />
          </View>
        ) : null}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t bg-surface px-4 pt-3"
        style={{
          paddingBottom: Math.max(insets.bottom, 16),
          borderColor: colors.borderLight,
        }}>
        {undoId ? (
          <View
            className="mb-3 flex-row items-center justify-between rounded-2xl px-4 py-3"
            style={{ backgroundColor: colors.surfaceContainer }}>
            <Text className="flex-1 text-sm text-ink">Word removed</Text>
            <Pressable onPress={() => void onUndo()} accessibilityRole="button">
              <Text className="text-sm font-bold" style={{ color: colors.secondary }}>
                Undo
              </Text>
            </Pressable>
          </View>
        ) : null}
        <View className="flex-row gap-3">
          <View className="min-w-0 flex-1">
            <Button
              title="Remove"
              variant="danger"
              className="w-full"
              onPress={onDelete}
              disabled={Boolean(undoId)}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Button
              title={saving ? 'Saving…' : 'Save'}
              className="w-full"
              onPress={() => void onSave()}
              disabled={saving || Boolean(undoId)}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  error,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
  error?: string;
  editable?: boolean;
}) {
  return (
    <View className="mt-4">
      <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
        {label}
      </Text>
      <TextInput
        className="rounded-[18px] border px-4 py-3.5 text-base text-ink"
        style={{
          backgroundColor: colors.surface,
          borderColor: error ? colors.danger : colors.borderLight,
          minHeight: multiline ? 96 : 52,
          textAlignVertical: multiline ? 'top' : 'center',
          opacity: editable ? 1 : 0.6,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        multiline={multiline}
        editable={editable}
        accessibilityLabel={label}
      />
      {error ? (
        <Text className="mt-1.5 text-sm" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
