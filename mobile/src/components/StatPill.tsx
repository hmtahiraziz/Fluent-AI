import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

type StatPillProps = {
  label: string;
  value: string;
  accent?: 'brand' | 'gold' | 'ocean' | 'accent';
};

const accents = {
  brand: 'bg-brand/10 border-brand/25',
  gold: 'bg-gold/15 border-gold/30',
  ocean: 'bg-accent/10 border-accent/25',
  accent: 'bg-accent/10 border-accent/25',
};

export function StatPill({ label, value, accent = 'brand' }: StatPillProps) {
  return (
    <View
      className={`min-w-[100px] flex-1 rounded-xl border px-3 py-3 ${accents[accent]}`}>
      <Text className="text-xs font-semibold text-ink-muted">{label}</Text>
      <Text className="mt-1 text-lg font-extrabold text-ink">{value}</Text>
    </View>
  );
}

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  emoji?: string;
};

export function SelectChip({ label, selected, onPress, emoji }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-3 min-h-[52px] flex-row items-center rounded-xl border px-4 py-3 ${
        selected ? 'border-brand bg-brand/10' : 'border-border bg-surface'
      }`}
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : undefined)}>
      {emoji ? <Text className="mr-2 text-xl">{emoji}</Text> : null}
      <Text className="text-base font-semibold text-ink">{label}</Text>
      {selected ? (
        <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-brand">
          <Text className="text-xs font-bold text-white">✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
