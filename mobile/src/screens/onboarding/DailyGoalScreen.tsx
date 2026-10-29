import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DAILY_GOAL_OPTIONS } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { DailyGoalOptionCard } from '../../components/ui/DailyGoalOptionCard';
import { InsightCard } from '../../components/ui/InsightCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'DailyGoal'>;

export function DailyGoalScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const initialGoal =
    DAILY_GOAL_OPTIONS.some(o => o.minutes === draft.dailyGoalMinutes)
      ? draft.dailyGoalMinutes
      : 10;
  const [selected, setSelected] = useState<number>(initialGoal);

  return (
    <OnboardingShell
      step={5}
      titlePrimary="Set your "
      titleAccent="daily goal"
      subtitle="Consistency is the key to mastering a new language. Pick a pace that fits you."
      footerHint={null}
      footerLabel="Continue"
      footerExtra={
        <InsightCard title="Tip" icon="💡">
          Learners who study for 10 minutes daily are 3x more likely to reach fluency in 6
          months.
        </InsightCard>
      }
      onContinue={() => {
        updateDraft({ dailyGoalMinutes: selected, step: 6 });
        navigation.navigate('PlanReady');
      }}>
      <View className="gap-3">
        {DAILY_GOAL_OPTIONS.map(option => (
          <DailyGoalOptionCard
            key={option.minutes}
            label={option.label}
            minutes={option.minutes}
            icon={option.icon}
            selected={selected === option.minutes}
            onPress={() => setSelected(option.minutes)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}
