import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { colors } from '../../theme/tokens';

type PromptChipProps = {
  label: string;
  emoji?: string;
  onPress: () => void;
};

export function PromptChip({ label, emoji, onPress }: PromptChipProps) {
  return (
    <PressableScale onPress={onPress}>
      <View
        className="mr-2 flex-row items-center rounded-full border border-border bg-surface px-4 py-2.5"
        style={{ borderColor: colors.lavender }}>
        {emoji ? <Text className="mr-1.5">{emoji}</Text> : null}
        <Text className="text-sm font-medium text-ink">{label}</Text>
      </View>
    </PressableScale>
  );
}

type SuggestionChipsProps = {
  prompts: readonly string[];
  onSelect: (prompt: string) => void;
};

export function SuggestionChips({ prompts, onSelect }: SuggestionChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 8, gap: 8 }}>
      {prompts.map(p => (
        <PressableScale key={p} onPress={() => onSelect(p)}>
          <View className="max-w-[280px] rounded-2xl border border-lavender bg-lavender-muted px-4 py-3">
            <Text className="text-sm leading-5 text-ink" numberOfLines={2}>
              {p}
            </Text>
          </View>
        </PressableScale>
      ))}
    </ScrollView>
  );
}
