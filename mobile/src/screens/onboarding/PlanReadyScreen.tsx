import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as api from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { languageMeta, MOTIVATIONS, ONBOARDING_STEPS } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { FluentAILogo } from '../../components/brand/FluentAILogo';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { OnboardingFooter } from '../../components/ui/OnboardingFooter';
import { PlanSummaryWidget } from '../../components/widgets/PlanSummaryWidget';
import { useResponsive } from '../../hooks/useResponsive';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PlanReady'>;

const CHECKLIST = [
  'Personalizing your tutor…',
  'Setting your level…',
  'Preparing your first chat…',
];

export function PlanReadyScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const { draft, clearDraft } = useOnboarding();
  const { setSettings, setPendingChat } = useAuth();
  const [tick, setTick] = useState(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => Math.min(t + 1, CHECKLIST.length));
    }, 700);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tick >= CHECKLIST.length) setReady(true);
  }, [tick]);

  const target = languageMeta(draft.targetLanguage);
  const motivationLabel =
    MOTIVATIONS.find(m => m.id === draft.motivation)?.label ?? draft.motivation;

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
        guided: true,
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setStarting(false);
    }
  }

  return (
    <View className="flex-1 bg-mist">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: horizontalPadding,
          paddingBottom: 24,
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
        }}>
        <FluentAILogo variant="compact" iconSize={32} />
        <View className="mt-6">
          <SplitHeadline primary="Your plan is" accent="ready!" />
        </View>
        <Text className="mb-6 mt-3 text-base leading-6 text-ink-muted">
          Everything is tailored to your goals. Let's say hello in your first chat.
        </Text>
        <PlanSummaryWidget
          target={target}
          level={draft.level}
          dailyMinutes={draft.dailyGoalMinutes}
          motivation={motivationLabel}
          loading={!ready}
          checklist={CHECKLIST.map((label, i) => ({
            label,
            done: tick > i,
          }))}
        />
        {error ? (
          <Text className="mt-4 text-sm font-semibold text-coral">{error}</Text>
        ) : null}
      </ScrollView>
      {ready ? (
        <OnboardingFooter
          label="Start first chat"
          step={ONBOARDING_STEPS}
          total={ONBOARDING_STEPS}
          loading={starting}
          onPress={startChat}
        />
      ) : null}
    </View>
  );
}
