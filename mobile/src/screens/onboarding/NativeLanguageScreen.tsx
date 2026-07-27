import React, { useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  featuredLanguages,
  isFeaturedLanguage,
  languageMeta,
  NATIVE_LANGUAGE_CODES,
  otherLanguages,
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

type Props = NativeStackScreenProps<OnboardingStackParamList, 'NativeLanguage'>;

export function NativeLanguageScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();
  const [selected, setSelected] = useState(draft.nativeLanguage || 'en');
  const [otherOpen, setOtherOpen] = useState(false);

  const featured = useMemo(
    () => featuredLanguages(NATIVE_LANGUAGE_CODES),
    [],
  );
  const others = useMemo(
    () => otherLanguages(NATIVE_LANGUAGE_CODES),
    [],
  );
  const isOtherSelected = !isFeaturedLanguage(selected, NATIVE_LANGUAGE_CODES);
  const selectedOther = isOtherSelected ? languageMeta(selected) : null;

  return (
    <OnboardingShell
      step={1}
      title="What is your native language?"
      subtitle="We'll use this to personalize your learning path and explain complex concepts."
      showBack
      footerExtra={
        <InsightCard title="AI Tip" className="mt-8">
          Our AI models work best when you choose your most fluent language. This ensures
          translated nuances remain accurate.
        </InsightCard>
      }
      onContinue={() => {
        updateDraft({ nativeLanguage: selected, step: 2 });
        navigation.navigate('TargetLanguage');
      }}>
      <ResponsiveGrid compactCols={1} gap={16}>
        {featured.map(lang => (
          <LanguageOptionCard
            key={lang.code}
            label={lang.label}
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
        title="Other native languages"
        languages={others}
        selectedCode={selected}
        onSelect={setSelected}
        onClose={() => setOtherOpen(false)}
      />
    </OnboardingShell>
  );
}
