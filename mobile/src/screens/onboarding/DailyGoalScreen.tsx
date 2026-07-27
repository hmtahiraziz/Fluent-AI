import React, { useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DAILY_GOALS } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { InsightCard } from '../../components/ui/InsightCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { SelectionRow } from '../../components/ui/SelectionRow';
import { DailyGoalWidget } from '../../components/widgets/DailyGoalWidget';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'DailyGoal'>;

export function DailyGoalScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const [selected, setSelected] = useState(draft.dailyGoalMinutes);

  return (
    <OnboardingShell
      step={5}
      titlePrimary="Set your "
      titleAccent="daily goal"
      subtitle="Consistency is the key to mastering a new language. Pick a pace that fits you."
      footerExtra={
        <InsightCard className="mt-6">
          Even 5 minutes a day builds a habit — your streak keeps you motivated.
        </InsightCard>
      }
      onContinue={() => {
        updateDraft({ dailyGoalMinutes: selected, step: 6 });
        navigation.navigate('PlanReady');
      }}>
      <DailyGoalWidget minutes={selected} progress={0} />
      <Text className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-ink-muted">
        Minutes per day
      </Text>
      {DAILY_GOALS.map(minutes => (
        <SelectionRow
          key={minutes}
          title={`${minutes} min / day`}
          leading={<Text className="text-xl">⏱️</Text>}
          selected={selected === minutes}
          onPress={() => setSelected(minutes)}
        />
      ))}
    </OnboardingShell>
  );
}
