import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../theme/tokens';
import { softShadow } from '../../theme/glass';

type StreakWidgetProps = {
  label: string;
};

export function StreakWidget({ label }: StreakWidgetProps) {
  return (
    <View
      className="flex-1 justify-between rounded-card p-5"
      style={[{ backgroundColor: colors.surface, minHeight: 180 }, softShadow()]}>
      <Text className="text-xs font-medium text-ink-muted">Streak</Text>
      <View className="my-2">
        <Text className="text-4xl font-extrabold text-ink">🔥</Text>
        <Text className="mt-1 text-2xl font-bold text-ink">{label}</Text>
      </View>
      <View
        className="mt-2 h-1 overflow-hidden rounded-full"
        style={{ backgroundColor: colors.surfaceContainer }}>
        <View
          className="h-full rounded-full"
          style={{ width: '66%', backgroundColor: colors.secondary }}
        />
      </View>
    </View>
  );
}
