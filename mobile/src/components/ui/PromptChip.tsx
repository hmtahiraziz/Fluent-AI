import React from 'react';
import { Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { colors } from '../../theme/tokens';

type PromptChipProps = {
  label: string;
  emoji?: string;
  active?: boolean;
  onPress: () => void;
};

export function PromptChip({ label, emoji, active, onPress }: PromptChipProps) {
  return (
    <PressableScale onPress={onPress}>
      <View
        className="flex-row items-center rounded-2xl px-5 py-3"
        style={{
          backgroundColor: active ? colors.secondaryContainer : colors.surfaceContainer,
        }}>
        {emoji ? <Text className="mr-2 text-base">{emoji}</Text> : null}
        <Text
          className="flex-1 text-sm font-bold"
          style={{ color: active ? colors.onSecondaryContainer : colors.inkMuted }}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

type SuggestionChipsProps = {
  prompts: readonly string[];
  onSelect: (prompt: string) => void;
  limit?: number;
};

export function SuggestionChips({ prompts, onSelect, limit = 4 }: SuggestionChipsProps) {
  const visible = prompts.slice(0, limit);

  return (
    <View className="gap-2">
      {visible.map(p => (
        <PressableScale key={p} onPress={() => onSelect(p)}>
          <View
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: colors.surfaceContainer }}>
            <Text className="text-sm font-bold leading-5 text-ink">{p}</Text>
          </View>
        </PressableScale>
      ))}
    </View>
  );
}

type TopicGridProps = {
  topics: readonly { emoji: string; label: string }[];
  activeLabel?: string | null;
  onSelect: (topic: { emoji: string; label: string }) => void;
  limit?: number;
};

export function TopicGrid({ topics, activeLabel, onSelect, limit = 4 }: TopicGridProps) {
  const visible = topics.slice(0, limit);

  return (
    <View className="gap-2">
      {visible.map(t => (
        <PromptChip
          key={t.label}
          emoji={t.emoji}
          label={t.label}
          active={activeLabel === t.label}
          onPress={() => onSelect(t)}
        />
      ))}
    </View>
  );
}
