import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type DailyGoalWidgetProps = {
  minutes: number;
  progress?: number;
  size?: 'compact' | 'regular';
};

export function DailyGoalWidget({
  minutes,
  progress = 0,
  size = 'regular',
}: DailyGoalWidgetProps) {
  const pct = Math.min(100, Math.max(0, progress));
  const compact = size === 'compact';

  return (
    <View
      className={`flex-1 rounded-2xl bg-surface ${compact ? 'p-3' : 'p-4'}`}
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}>
      <Text className="text-xs font-semibold text-ink-muted">Daily goal</Text>
      <Text className={`mt-1 font-extrabold text-ink ${compact ? 'text-lg' : 'text-xl'}`}>
        {minutes} min
      </Text>
      <View className="mt-3 h-2 overflow-hidden rounded-full bg-mist">
        <View
          className="h-full rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
