import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type StreakWidgetProps = {
  label: string;
  size?: 'compact' | 'regular';
};

export function StreakWidget({ label, size = 'regular' }: StreakWidgetProps) {
  const compact = size === 'compact';
  return (
    <View
      className={`flex-1 rounded-2xl bg-gold/10 ${compact ? 'p-3' : 'p-4'}`}
      style={{ borderWidth: 1, borderColor: `${colors.gold}40` }}>
      <Text className="text-xs font-semibold text-ink-muted">Streak</Text>
      <View className="mt-1 flex-row items-center gap-1.5">
        <Text className="text-lg">🔥</Text>
        <Text className={`font-extrabold text-ink ${compact ? 'text-lg' : 'text-xl'}`}>
          {label}
        </Text>
      </View>
    </View>
  );
}
