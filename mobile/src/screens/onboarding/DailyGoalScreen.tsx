import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DAILY_GOAL_OPTIONS } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { DailyGoalOptionCard } from '../../components/ui/DailyGoalOptionCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { colors } from '../../theme/tokens';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'DailyGoal'>;

const INSIGHT_BROWN = '#4c4632';
const INSIGHT_GOLD = '#B2822B';

export function DailyGoalScreen({ navigation }: Props) {
  const { updateDraft } = useOnboarding();
  const [selected, setSelected] = useState<number>(10);

  return (
    <OnboardingShell
      step={5}
      titlePrimary="Set your "
      titleAccent="daily goal"
      subtitle="Consistency is the key to mastering a new language. Pick a pace that fits you."
      centerStepLabel
      centerTitle
      footerHint={null}
      footerPlacement="scroll"
      footerVariant="pill"
      onContinue={() => {
        updateDraft({ dailyGoalMinutes: selected, step: 6 });
        navigation.navigate('PlanReady');
      }}>
      <View className="gap-4">
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

      <View
        className="mt-8 flex-row items-start gap-3 rounded-[24px] p-4"
        style={{ backgroundColor: colors.insight }}>
        <Text className="text-xl" style={{ color: INSIGHT_GOLD }}>
          💡
        </Text>
        <Text className="flex-1 text-sm leading-6" style={{ color: INSIGHT_BROWN }}>
          Users who study for <Text className="font-bold">10 minutes</Text> daily are 3x more
          likely to reach fluency in 6 months.
        </Text>
      </View>
    </OnboardingShell>
  );
}
