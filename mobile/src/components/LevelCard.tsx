import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { CefrLevel } from '../config/constants';
import { CEFR_DESCRIPTIONS } from '../config/constants';

type LevelCardProps = {
  level: CefrLevel;
  selected?: boolean;
  onPress: () => void;
};

export function LevelCard({ level, selected, onPress }: LevelCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-3 min-h-[72px] rounded-xl border px-4 py-3 ${
        selected ? 'border-brand bg-brand/10' : 'border-border bg-surface'
      }`}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}>
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-extrabold text-ink">{level}</Text>
        {selected ? (
          <View className="h-6 w-6 items-center justify-center rounded-full bg-brand">
            <Text className="text-xs font-bold text-white">✓</Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-1 text-sm text-ink-muted">{CEFR_DESCRIPTIONS[level]}</Text>
    </Pressable>
  );
}
