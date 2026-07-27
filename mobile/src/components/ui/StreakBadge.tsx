import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type StreakBadgeProps = {
  label: string;
  compact?: boolean;
};

export function StreakBadge({ label, compact = false }: StreakBadgeProps) {
  return (
    <View
      className={`shrink-0 flex-row items-center rounded-full ${compact ? 'px-3 py-1' : 'px-4 py-1.5'}`}
      style={{ backgroundColor: colors.primarySoft }}>
      <Text className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: colors.primaryDark }}>
        🔥 {label}
      </Text>
    </View>
  );
}
