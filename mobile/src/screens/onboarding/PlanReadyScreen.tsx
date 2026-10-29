import React, { useState } from 'react';
import { Text, View } from 'react-native';
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
import { ErrorCard } from '../../components/ui/ErrorCard';
import { InsightCard } from '../../components/ui/InsightCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { colors } from '../../theme/tokens';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PlanReady'>;

/** Real product capabilities — not invented curriculum claims. */
const INCLUDED_ITEMS = [
  'AI tutor chat in your target language',
  'Corrections and vocabulary you choose to save',
  'Spaced-repetition review for saved words',
] as const;

function motivationDisplayLabel(id: string): string {
  return MOTIVATIONS.find(m => m.id === id)?.label ?? id;
}

function SummaryRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <>
      <View className="flex-row items-center justify-between py-2.5">
        <Text className="text-sm text-ink-muted">{label}</Text>
        <Text className="ml-3 max-w-[58%] text-right text-sm font-bold text-brand">
          {value}
        </Text>
      </View>
      {last ? null : (
        <View className="h-px" style={{ backgroundColor: colors.borderLight }} />
      )}
    </>
  );
}

export function PlanReadyScreen(_props: Props) {
  const { draft, clearDraft } = useOnboarding();
  const { setSettings, setPendingChat } = useAuth();
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const native = languageMeta(draft.nativeLanguage);
  const target = languageMeta(draft.targetLanguage);
  const levelMeta = CEFR_LEVEL_META[draft.level as CefrLevel] ?? CEFR_LEVEL_META.A1;
  const motivationLabel = motivationDisplayLabel(draft.motivation);
  const dailyMinutes = draft.dailyGoalMinutes;

  async function startChat() {
    setStarting(true);
    setError('');
    try {
      const settings = await api.updateSettings({
        nativeLanguage: draft.nativeLanguage,
        targetLanguage: draft.targetLanguage,
        level: draft.level,
        motivation: draft.motivation,
        dailyGoalMinutes: draft.dailyGoalMinutes,
        onboardingCompleted: true,
      });
      setSettings(settings);
      const conversation = await api.createConversation({ title: 'First practice' });
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
    <OnboardingShell
      step={6}
      titlePrimary="Your plan is "
      titleAccent="ready"
      subtitle="Here's a summary of what you chose. We'll use these preferences for tutoring and practice."
      footerLabel="Start first chat"
      footerHint={null}
      footerVariant="dark"
      footerShowArrow
      footerLoading={starting}
      footerPlacement="sticky"
      onContinue={startChat}>
      <View className="gap-3">
        <View
          className="rounded-[20px] p-5"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}>
          <View className="mb-4 flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primarySoft }}>
              <Text className="text-2xl">{target.flag}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-extrabold uppercase tracking-wider text-brand">
                Your selections
              </Text>
              <Text className="mt-0.5 text-xl font-extrabold text-ink">
                {native.label} → {target.label}
              </Text>
            </View>
          </View>

          <View
            className="rounded-2xl px-4 py-2"
            style={{ backgroundColor: colors.surfaceContainerLow }}>
            <SummaryRow label="Native language" value={native.label} />
            <SummaryRow label="Target language" value={target.label} />
            <SummaryRow label="Motivation" value={motivationLabel} />
            <SummaryRow label="Starting level" value={levelMeta.fullLabel} />
            <SummaryRow
              label="Daily goal"
              value={`${dailyMinutes} min / day`}
              last
            />
          </View>
        </View>

        <InsightCard title="Next step" icon="💬">
          <Text className="text-base font-medium leading-6 text-ink">
            Practice {target.label} at {levelMeta.fullLabel} with a {dailyMinutes}-minute
            daily goal. Your tutor will explain corrections in {native.label}.
          </Text>
        </InsightCard>

        <View
          className="rounded-[20px] p-5"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}>
          <Text className="mb-4 text-[11px] font-extrabold uppercase tracking-wider text-brand">
            What's included
          </Text>
          {INCLUDED_ITEMS.map((item, index) => (
            <View
              key={item}
              className={`flex-row items-center gap-3 ${index < INCLUDED_ITEMS.length - 1 ? 'mb-3.5' : ''}`}>
              <View
                className="h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.secondaryContainer }}>
                <Text
                  className="text-xs font-bold"
                  style={{ color: colors.onSecondaryContainer }}>
                  ✓
                </Text>
              </View>
              <Text className="flex-1 text-base font-medium text-ink">{item}</Text>
            </View>
          ))}
        </View>

        <View
          className="items-center rounded-[20px] px-6 py-7"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-4xl">📚</Text>
          <Text className="mt-3 text-center text-base font-semibold text-ink">
            Ready to start practicing {target.label}
          </Text>
        </View>

        {error ? <ErrorCard message={error} onRetry={() => void startChat()} /> : null}
      </View>
    </OnboardingShell>
  );
}
