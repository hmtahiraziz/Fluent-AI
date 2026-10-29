import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CEFR_LEVELS, CEFR_LEVEL_META, type CefrLevel } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { CefrLevelCard } from '../../components/ui/CefrLevelCard';
import { InsightCard } from '../../components/ui/InsightCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { View } from 'react-native';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Level'>;

export function LevelScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const initialLevel = (CEFR_LEVELS.includes(draft.level as CefrLevel)
    ? draft.level
    : 'B1') as CefrLevel;
  const [selected, setSelected] = useState<CefrLevel>(initialLevel);

  return (
    <OnboardingShell
      step={4}
      titlePrimary="What's your current "
      titleAccent="level?"
      subtitle="This helps us personalize your learning path and daily challenges."
      footerHint={null}
      footerExtra={
        <InsightCard title="Personalized insight">
          Most learners start at B1 to build confidence before jumping into conversational
          practice.
        </InsightCard>
      }
      onContinue={() => {
        updateDraft({ level: selected, step: 5 });
        navigation.navigate('DailyGoal');
      }}>
      <View className="gap-3">
        {CEFR_LEVELS.map(level => {
          const meta = CEFR_LEVEL_META[level];
          return (
            <CefrLevelCard
              key={level}
              level={level}
              title={meta.title}
              subtitle={meta.subtitle}
              selected={selected === level}
              compact
              onPress={() => setSelected(level)}
            />
          );
        })}
      </View>
    </OnboardingShell>
  );
}
