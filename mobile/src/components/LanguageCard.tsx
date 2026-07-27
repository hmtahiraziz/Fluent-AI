import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { LanguageMeta } from '../config/constants';

type LanguageCardProps = {
  language: LanguageMeta;
  selected?: boolean;
  onPress: () => void;
};

export function LanguageCard({ language, selected, onPress }: LanguageCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[88px] rounded-2xl border p-4 ${
        selected ? 'border-brand bg-brand/8' : 'border-border bg-surface'
      }`}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}>
      <Text className="text-3xl">{language.flag}</Text>
      <Text className="mt-2 text-base font-extrabold text-ink">{language.label}</Text>
      <Text className="text-sm text-ink-muted">{language.nativeLabel}</Text>
      {selected ? (
        <View className="absolute right-3 top-3 h-6 w-6 items-center justify-center rounded-full bg-brand">
          <Text className="text-xs font-bold text-white">✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
