import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as api from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import {
  CEFR_LEVEL_META,
  languageMeta,
  MOTIVATIONS,
  type CefrLevel,
} from '../../config/constants';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { OnboardingFooter } from '../../components/ui/OnboardingFooter';
import { useResponsive } from '../../hooks/useResponsive';
import { softShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PlanReady'>;

const INCLUDED_ITEMS = [
  'Personalized curriculum',
  'Daily AI coaching',
  'Smart vocabulary',
] as const;

function nextLevelLabel(level: string): string {
  const order: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const idx = order.indexOf(level as CefrLevel);
  const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 'B2';
  return CEFR_LEVEL_META[next].title;
}

function projectFluencyDate(dailyMinutes: number): string {
  const months = dailyMinutes >= 20 ? 5 : dailyMinutes >= 15 ? 6 : dailyMinutes >= 10 ? 8 : 10;
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function motivationDisplayLabel(id: string): string {
  if (id === 'work') return 'Business Fluency';
  return MOTIVATIONS.find(m => m.id === id)?.label ?? id;
}

export function PlanReadyScreen(_props: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentMaxWidth, isTablet } = useResponsive();
  const { draft, clearDraft } = useOnboarding();
  const { setSettings, setPendingChat } = useAuth();
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const target = languageMeta(draft.targetLanguage);
  const levelMeta = CEFR_LEVEL_META[draft.level as CefrLevel] ?? CEFR_LEVEL_META.B1;
  const motivationLabel = motivationDisplayLabel(draft.motivation);
  const projectionDate = useMemo(
    () => projectFluencyDate(draft.dailyGoalMinutes),
    [draft.dailyGoalMinutes],
  );
  const nextLevel = useMemo(() => nextLevelLabel(draft.level), [draft.level]);

  async function startChat() {
    setStarting(true);
    setError('');
    try {
      const settings = await api.updateSettings({
        nativeLanguage: draft.nativeLanguage,
        targetLanguage: draft.targetLanguage,
        level: draft.level,
        dailyGoalMinutes: draft.dailyGoalMinutes,
        onboardingCompleted: true,
      });
      setSettings(settings);
      const conversation = await api.createConversation('First practice');
      await clearDraft();
      setPendingChat({
        conversationId: conversation.id,
        title: 'First practice',
        language: conversation.language,
        level: conversation.level,
        guided: true,
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setStarting(false);
    }
  }

  return (
    <View className="flex-1 bg-canvas">
      <View
        className="flex-row items-center bg-canvas"
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: horizontalPadding,
          paddingBottom: 8,
        }}>
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full"
          accessibilityLabel="Go back"
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.surfaceContainerHighest : 'transparent',
          })}>
          <Text className="text-2xl text-brand">←</Text>
        </Pressable>
        <Text className="ml-4 text-sm font-bold text-brand">Step 6 of 6</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom, 24) + 80,
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
        }}
        showsVerticalScrollIndicator={false}>
        <Text
          className={`font-extrabold text-ink ${isTablet ? 'text-[40px] leading-[48px]' : 'text-[32px] leading-10'}`}>
          Your plan is <Text style={{ color: colors.accent }}>ready</Text>
        </Text>
        <Text className="mt-2 max-w-sm text-base leading-6 text-ink-muted">
          We've built a roadmap specifically for your learning style and goals.
        </Text>

        <View className={`mt-8 gap-4 ${isTablet ? 'flex-row' : ''}`}>
          <View
            className={`rounded-[24px] border p-6 ${isTablet ? 'flex-1' : ''}`}
            style={[
              softShadow(),
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceContainerHighest,
              },
            ]}>
            <View className="mb-4 flex-row items-center gap-3">
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.primarySoft }}>
                <Text className="text-2xl">{target.flag}</Text>
              </View>
              <View>
                <Text className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Target Language
                </Text>
                <Text className="text-xl font-bold text-ink">{target.label}</Text>
              </View>
            </View>
            <View
              className="border-b py-2"
              style={{ borderColor: colors.surfaceContainer }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-ink-muted">Selected Goal</Text>
                <Text className="text-sm font-bold text-brand">{motivationLabel}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-base text-ink-muted">Starting Level</Text>
              <Text className="text-sm font-bold text-brand">{levelMeta.fullLabel}</Text>
            </View>
          </View>

          <View
            className={`rounded-[24px] p-6 ${isTablet ? 'flex-1' : ''}`}
            style={{ backgroundColor: colors.insight }}>
            <View className="mb-4 flex-row items-center gap-2">
              <Text className="text-lg">💡</Text>
              <Text className="text-sm font-bold text-tertiary">AI Projection</Text>
            </View>
            <Text className="text-lg font-medium leading-7 text-ink">
              You'll reach{' '}
              <Text className="font-bold">
                {nextLevel} Fluency
              </Text>{' '}
              by {projectionDate} based on your {draft.dailyGoalMinutes}-min daily goal.
            </Text>
            <View className="mt-6 flex-row items-center">
              {['🧑‍🏫', '👩‍💻'].map((emoji, i) => (
                <View
                  key={emoji}
                  className="h-8 w-8 items-center justify-center rounded-full border-2 bg-white"
                  style={{
                    borderColor: colors.insight,
                    marginLeft: i > 0 ? -8 : 0,
                  }}>
                  <Text className="text-sm">{emoji}</Text>
                </View>
              ))}
              <View
                className="-ml-2 h-8 w-8 items-center justify-center rounded-full border-2"
                style={{ borderColor: colors.insight, backgroundColor: colors.tertiary }}>
                <Text className="text-[10px] font-bold text-white">+12</Text>
              </View>
            </View>
          </View>
        </View>

        <View
          className="mt-8 rounded-[24px] p-8"
          style={{ backgroundColor: colors.surfaceContainerLow }}>
          <Text className="mb-6 text-sm font-bold uppercase tracking-widest text-ink-muted">
            What's Included
          </Text>
          {INCLUDED_ITEMS.map(item => (
            <View key={item} className="mb-5 flex-row items-center gap-4">
              <View
                className="h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.secondaryContainer }}>
                <Text className="text-xs font-bold" style={{ color: colors.onSecondaryContainer }}>
                  ✓
                </Text>
              </View>
              <Text className="text-lg font-medium text-ink">{item}</Text>
            </View>
          ))}
        </View>

        <View
          className="mt-8 h-48 overflow-hidden rounded-[24px]"
          style={{ backgroundColor: colors.surfaceContainer }}>
          <View className="flex-1 items-center justify-center px-8 py-10">
            <Text className="text-5xl">📚</Text>
            <Text className="mt-4 text-center text-base font-medium text-ink-muted">
              Your personalized {target.label} journey starts now
            </Text>
          </View>
        </View>

        {error ? (
          <Text className="mt-4 text-sm font-semibold text-coral">{error}</Text>
        ) : null}

        <View className="mt-8">
          <OnboardingFooter
            label="Start first chat"
            hint={null}
            variant="dark"
            showArrow
            loading={starting}
            onPress={startChat}
          />
        </View>
      </ScrollView>
    </View>
  );
}
