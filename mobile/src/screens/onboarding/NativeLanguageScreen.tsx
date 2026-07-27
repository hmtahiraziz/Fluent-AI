import React, { useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LANGUAGES } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { InsightCard } from '../../components/ui/InsightCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { SelectionRow } from '../../components/ui/SelectionRow';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'NativeLanguage'>;

export function NativeLanguageScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const [selected, setSelected] = useState(draft.nativeLanguage);

  return (
    <OnboardingShell
      step={1}
      titlePrimary="What is your native "
      titleAccent="language?"
      subtitle="We'll use this to personalize your learning path and explain complex concepts."
      footerExtra={
        <InsightCard title="AI Tip" className="mt-6">
          Our AI models work best when you choose your most fluent language. This ensures
          translated nuances remain accurate.
        </InsightCard>
      }
      onContinue={() => {
        updateDraft({ nativeLanguage: selected, step: 2 });
        navigation.navigate('TargetLanguage');
      }}>
      {LANGUAGES.map(lang => (
        <SelectionRow
          key={lang.code}
          title={lang.label}
          subtitle={lang.nativeLabel}
          leading={<Text className="text-2xl">{lang.flag}</Text>}
          selected={selected === lang.code}
          onPress={() => setSelected(lang.code)}
        />
      ))}
    </OnboardingShell>
  );
}
