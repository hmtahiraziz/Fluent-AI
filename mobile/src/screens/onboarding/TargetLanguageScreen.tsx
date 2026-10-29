import React, { useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  featuredLanguages,
  isFeaturedLanguage,
  languageMeta,
  otherLanguages,
  TARGET_LANGUAGE_CODES,
} from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { ResponsiveGrid } from '../../components/ResponsiveGrid';
import { InsightCard } from '../../components/ui/InsightCard';
import { LanguagePickerModal } from '../../components/ui/LanguagePickerModal';
import {
  LanguageOptionCard,
  OtherLanguagesCard,
} from '../../components/ui/LanguageOptionCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'TargetLanguage'>;

export function TargetLanguageScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(draft.targetLanguage || null);
  const [otherOpen, setOtherOpen] = useState(false);

  const featured = useMemo(
    () => featuredLanguages(TARGET_LANGUAGE_CODES),
    [],
  );
  const others = useMemo(
    () => otherLanguages(TARGET_LANGUAGE_CODES),
    [],
  );
  const isOtherSelected = selected
    ? !isFeaturedLanguage(selected, TARGET_LANGUAGE_CODES)
    : false;
  const selectedOther = isOtherSelected && selected ? languageMeta(selected) : null;

  return (
    <OnboardingShell
      step={2}
      titlePrimary="What would you like to "
      titleAccent="learn?"
      subtitle="Pick the language you want to practice conversations in."
      footerHint={null}
      footerShowArrow
      footerDisabled={!selected}
      footerExtra={
        <InsightCard title="Did you know" icon="✨">
          Learning a new language creates new neural pathways and can delay cognitive decline
          by up to 4 years.
        </InsightCard>
      }
      onContinue={() => {
        if (!selected) return;
        updateDraft({ targetLanguage: selected, step: 3 });
        navigation.navigate('Motivation');
      }}>
      <ResponsiveGrid compactCols={1} gap={12}>
        {featured.map(lang => (
          <LanguageOptionCard
            key={lang.code}
            label={lang.label}
            nativeLabel={lang.nativeLabel}
            flag={lang.flag}
            selected={selected === lang.code}
            onPress={() => setSelected(lang.code)}
          />
        ))}
        <OtherLanguagesCard
          selected={isOtherSelected}
          selectedLabel={selectedOther?.label}
          selectedNativeLabel={selectedOther?.nativeLabel}
          selectedFlag={selectedOther?.flag}
          onPress={() => setOtherOpen(true)}
        />
      </ResponsiveGrid>

      <LanguagePickerModal
        visible={otherOpen}
        title="Other languages to learn"
        languages={others}
        selectedCode={selected ?? ''}
        onSelect={setSelected}
        onClose={() => setOtherOpen(false)}
      />
    </OnboardingShell>
  );
}
