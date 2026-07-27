import React, { useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DAILY_GOALS } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
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
      titlePrimary="Set your"
      titleAccent="daily goal"
      subtitle="Consistency beats intensity. Pick what feels realistic."
      onContinue={() => {
        updateDraft({ dailyGoalMinutes: selected, step: 6 });
        navigation.navigate('PlanReady');
      }}>
      <DailyGoalWidget minutes={selected} progress={0} />
      <Text className="mb-2 mt-6 text-sm font-semibold text-ink-muted">Minutes per day</Text>
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
