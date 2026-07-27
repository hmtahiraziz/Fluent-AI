import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CEFR_LEVELS, CEFR_LEVEL_META, type CefrLevel } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { CefrLevelCard } from '../../components/ui/CefrLevelCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { colors } from '../../theme/tokens';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Level'>;

export function LevelScreen({ navigation }: Props) {
  const { updateDraft } = useOnboarding();
  const [selected, setSelected] = useState<CefrLevel>('B1');

  return (
    <OnboardingShell
      step={4}
      titlePrimary="What's your current "
      titleAccent="level?"
      subtitle="This helps us personalize your learning path and daily challenges."
      centerStepLabel
      footerHint={null}
      footerVariant="pill"
      onContinue={() => {
        updateDraft({ level: selected, step: 5 });
        navigation.navigate('DailyGoal');
      }}>
      {CEFR_LEVELS.map(level => {
        const meta = CEFR_LEVEL_META[level];
        return (
          <CefrLevelCard
            key={level}
            level={level}
            title={meta.title}
            subtitle={meta.subtitle}
            selected={selected === level}
            onPress={() => setSelected(level)}
          />
        );
      })}

      <View
        className="mt-8 flex-row items-start gap-4 rounded-[24px] p-6"
        style={{ backgroundColor: colors.insight }}>
        <Text className="text-xl text-tertiary">✨</Text>
        <View className="flex-1">
          <Text className="text-sm font-bold text-tertiary">Personalized insight</Text>
          <Text className="mt-1 text-base leading-6 text-tertiary">
            Most users start at B1 to build confidence before jumping into conversational
            practice.
          </Text>
        </View>
      </View>
    </OnboardingShell>
  );
}
