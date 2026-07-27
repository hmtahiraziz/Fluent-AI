import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MOTIVATIONS } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { ResponsiveGrid } from '../../components/ResponsiveGrid';
import { MotivationOptionCard } from '../../components/ui/MotivationOptionCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { colors } from '../../theme/tokens';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Motivation'>;

export function MotivationScreen({ navigation }: Props) {
  const { updateDraft } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  const mainMotivations = MOTIVATIONS.filter(m => m.id !== 'fun');
  const funMotivation = MOTIVATIONS.find(m => m.id === 'fun')!;

  return (
    <OnboardingShell
      step={3}
      titlePrimary="Why are you "
      titleAccent="learning?"
      subtitle="This helps us personalize your curriculum and practice scenarios."
      inlineHeaderProgress
      footerHint={null}
      footerDisabled={!selected}
      footerExtra={
        <View
          className="mt-8 flex-row items-start gap-4 rounded-[24px] p-6"
          style={{ backgroundColor: colors.insight }}>
          <Text className="text-xl text-tertiary">✨</Text>
          <Text className="flex-1 text-base leading-6 text-tertiary">
            <Text className="font-bold">Smart Choice: </Text>
            Selecting a specific goal helps our AI tailor your daily vocabulary to things
            you'll actually use.
          </Text>
        </View>
      }
      onContinue={() => {
        if (!selected) return;
        updateDraft({ motivation: selected, step: 4 });
        navigation.navigate('Level');
      }}>
      <ResponsiveGrid compactCols={1} gap={16}>
        {mainMotivations.map(m => (
          <MotivationOptionCard
            key={m.id}
            title={m.label}
            description={m.description}
            icon={m.emoji}
            iconBackground={m.iconBg}
            selected={selected === m.id}
            onPress={() => setSelected(m.id)}
          />
        ))}
      </ResponsiveGrid>

      <View className="mt-4">
        <MotivationOptionCard
          title={funMotivation.label}
          description={funMotivation.description}
          icon={funMotivation.emoji}
          iconBackground={funMotivation.iconBg}
          selected={selected === funMotivation.id}
          onPress={() => setSelected(funMotivation.id)}
          layout="horizontal"
        />
      </View>
    </OnboardingShell>
  );
}
