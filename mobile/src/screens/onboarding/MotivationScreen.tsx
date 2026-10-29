import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MOTIVATIONS } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { InsightCard } from '../../components/ui/InsightCard';
import { MotivationOptionCard } from '../../components/ui/MotivationOptionCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { View } from 'react-native';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Motivation'>;

export function MotivationScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(draft.motivation || null);

  return (
    <OnboardingShell
      step={3}
      titlePrimary="Why are you "
      titleAccent="learning?"
      subtitle="This helps us personalize your curriculum and practice scenarios."
      footerHint={null}
      footerDisabled={!selected}
      footerExtra={
        <InsightCard title="Smart choice">
          Selecting a specific goal helps our AI tailor your daily vocabulary to things you'll
          actually use.
        </InsightCard>
      }
      onContinue={() => {
        if (!selected) return;
        updateDraft({ motivation: selected, step: 4 });
        navigation.navigate('Level');
      }}>
      <View className="gap-3">
        {MOTIVATIONS.map(m => (
          <MotivationOptionCard
            key={m.id}
            title={m.label}
            description={m.description}
            icon={m.emoji}
            iconBackground={m.iconBg}
            selected={selected === m.id}
            onPress={() => setSelected(m.id)}
            layout="horizontal"
          />
        ))}
      </View>
    </OnboardingShell>
  );
}
