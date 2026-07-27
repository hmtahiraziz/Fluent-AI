import React, { useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LANGUAGES } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { SelectionRow } from '../../components/ui/SelectionRow';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'NativeLanguage'>;

export function NativeLanguageScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const [selected, setSelected] = useState(draft.nativeLanguage);

  return (
    <OnboardingShell
      step={1}
      titlePrimary="What language"
      titleAccent="do you speak?"
      subtitle="We'll use this for explanations and app guidance."
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
