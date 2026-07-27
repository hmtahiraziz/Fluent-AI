import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CEFR_DESCRIPTIONS, CEFR_LEVELS, type CefrLevel } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { SelectionRow } from '../../components/ui/SelectionRow';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Level'>;

export function LevelScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const [selected, setSelected] = useState<CefrLevel>(draft.level as CefrLevel);

  return (
    <OnboardingShell
      step={4}
      titlePrimary="How much do"
      titleAccent="you know?"
      subtitle="Not sure? Start at A1 — you can always level up."
      onContinue={() => {
        updateDraft({ level: selected, step: 5 });
        navigation.navigate('DailyGoal');
      }}>
      {CEFR_LEVELS.map(level => (
        <SelectionRow
          key={level}
          title={level}
          subtitle={CEFR_DESCRIPTIONS[level]}
          selected={selected === level}
          onPress={() => setSelected(level)}
        />
      ))}
    </OnboardingShell>
  );
}
