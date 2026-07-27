import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
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
import { LanguagePickerModal } from '../../components/ui/LanguagePickerModal';
import {
  LanguageOptionCard,
  OtherLanguagesCard,
} from '../../components/ui/LanguageOptionCard';
import { OnboardingShell } from '../../components/ui/OnboardingShell';
import { colors } from '../../theme/tokens';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'TargetLanguage'>;

const INSIGHT_GOLD = '#8B6E2F';

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
      centerStepLabel
      footerHint={null}
      footerShowArrow
      footerDisabled={!selected}
      footerExtra={
        <View
          className="mt-8 flex-row items-start gap-4 rounded-[24px] p-6"
          style={{ backgroundColor: colors.insight }}>
          <Text className="text-xl" style={{ color: INSIGHT_GOLD }}>
            ✨
          </Text>
          <Text className="flex-1 text-base leading-6" style={{ color: INSIGHT_GOLD }}>
            Did you know? Learning a new language creates new neural pathways and can delay
            cognitive decline by up to 4 years.
          </Text>
        </View>
      }
      onContinue={() => {
        if (!selected) return;
        updateDraft({ targetLanguage: selected, step: 3 });
        navigation.navigate('Motivation');
      }}>
      <ResponsiveGrid compactCols={1} gap={16}>
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
