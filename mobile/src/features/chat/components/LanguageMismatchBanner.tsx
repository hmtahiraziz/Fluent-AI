import React from 'react';
import { Text, View } from 'react-native';
import { languageMeta } from '../../../config/constants';
import { colors } from '../../../theme/tokens';

type LanguageMismatchBannerProps = {
  conversationLanguage: string;
  currentTargetLanguage: string;
};

export function LanguageMismatchBanner({
  conversationLanguage,
  currentTargetLanguage,
}: LanguageMismatchBannerProps) {
  const chatLang = languageMeta(conversationLanguage);
  const currentLang = languageMeta(currentTargetLanguage);

  return (
    <View
      className="mx-4 mb-2 flex-row items-start gap-2 rounded-2xl border px-3 py-2.5"
      style={{
        borderColor: colors.insightBorder,
        backgroundColor: colors.insight,
      }}>
      <Text className="text-sm">ℹ️</Text>
      <Text className="flex-1 text-xs leading-5 text-tertiary">
        This chat is in {chatLang.label}. Your current learning language is{' '}
        {currentLang.label}. Start a new chat from Practice to use your latest settings.
      </Text>
    </View>
  );
}
