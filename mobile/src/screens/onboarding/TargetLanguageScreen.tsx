import React, { useMemo, useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LANGUAGES } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { Input } from '../../components/Input';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { SelectionRow } from '../../components/ui/SelectionRow';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'TargetLanguage'>;

export function TargetLanguageScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const [selected, setSelected] = useState(draft.targetLanguage);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      l =>
        l.label.toLowerCase().includes(q) ||
        l.nativeLabel.toLowerCase().includes(q) ||
        l.code.includes(q),
    );
  }, [query]);

  return (
    <OnboardingShell
      step={2}
      titlePrimary="Which language"
      titleAccent="would you like to learn?"
      subtitle="You can change this anytime in your profile."
      onContinue={() => {
        updateDraft({ targetLanguage: selected, step: 3 });
        navigation.navigate('Motivation');
      }}>
      <Input
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="Spanish, Urdu, English…"
        autoCapitalize="none"
      />
      {filtered.map(lang => (
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
