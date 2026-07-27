import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LANGUAGES } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { InsightCard } from '../../components/ui/InsightCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { SelectionRow } from '../../components/ui/SelectionRow';
import { colors } from '../../theme/tokens';

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
      titlePrimary="Which language would you "
      titleAccent="like to learn?"
      subtitle="You can change this anytime in your profile."
      footerExtra={
        <InsightCard title="AI Tip" className="mt-6">
          Choose a language you're excited about — motivation is the strongest predictor of fluency.
        </InsightCard>
      }
      onContinue={() => {
        updateDraft({ targetLanguage: selected, step: 3 });
        navigation.navigate('Motivation');
      }}>
      <TextInput
        className="mb-4 h-[52px] rounded-full border px-5 text-base text-ink"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          borderColor: colors.border,
        }}
        placeholder="Search languages…"
        placeholderTextColor={colors.inkFaint}
        value={query}
        onChangeText={setQuery}
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
