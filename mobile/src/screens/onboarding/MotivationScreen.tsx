import React, { useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MOTIVATIONS } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { InsightCard } from '../../components/ui/InsightCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { SelectionRow } from '../../components/ui/SelectionRow';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Motivation'>;

export function MotivationScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const [selected, setSelected] = useState(draft.motivation);

  return (
    <OnboardingShell
      step={3}
      titlePrimary="Why are you "
      titleAccent="learning?"
      subtitle="This helps us personalize your FluentAI tutor."
      footerExtra={
        <InsightCard className="mt-6">
          Your motivation shapes the topics and scenarios your AI tutor will focus on.
        </InsightCard>
      }
      onContinue={() => {
        updateDraft({ motivation: selected, step: 4 });
        navigation.navigate('Level');
      }}>
      {MOTIVATIONS.map(m => (
        <SelectionRow
          key={m.id}
          title={m.label}
          leading={<Text className="text-2xl">{m.emoji}</Text>}
          selected={selected === m.id}
          onPress={() => setSelected(m.id)}
        />
      ))}
    </OnboardingShell>
  );
}
