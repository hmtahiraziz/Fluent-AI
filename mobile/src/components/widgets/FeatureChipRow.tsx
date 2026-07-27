import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { softShadow } from '../../theme/glass';

const FEATURES = [
  { emoji: '💬', label: 'AI conversations' },
  { emoji: '📚', label: 'Smart vocabulary' },
  { emoji: '🎯', label: 'Personal plan' },
] as const;

export function FeatureChipRow() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {FEATURES.map(f => (
        <View
          key={f.label}
          className="flex-row items-center gap-2 rounded-full bg-surface px-4 py-2.5"
          style={softShadow(2)}>
          <Text>{f.emoji}</Text>
          <Text className="text-sm font-semibold text-ink">{f.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
