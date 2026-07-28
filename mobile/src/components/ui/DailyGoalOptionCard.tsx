import React from 'react';
import { Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { softShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type DailyGoalOptionCardProps = {
  label: string;
  minutes: number;
  icon: string;
  selected?: boolean;
  embedded?: boolean;
  onPress: () => void;
};

export function DailyGoalOptionCard({
  label,
  minutes,
  icon,
  selected = false,
  embedded = false,
  onPress,
}: DailyGoalOptionCardProps) {
  return (
    <PressableScale onPress={onPress}>
      <View
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={`flex-row items-center justify-between rounded-[24px] p-4 ${embedded ? 'border' : 'border-2'}`}
        style={[
          embedded ? undefined : softShadow(),
          {
            backgroundColor: selected ? colors.primarySoft : colors.surface,
            borderColor: selected ? colors.secondary : embedded ? colors.borderLight : 'transparent',
            borderWidth: selected ? (embedded ? 1.5 : 2) : embedded ? 1 : 2,
          },
        ]}>
        <View className="flex-row items-center gap-4">
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: selected ? colors.secondaryFixedDim : colors.surfaceContainer,
            }}>
            <Text className="text-2xl">{icon}</Text>
          </View>
          <View>
            <Text className="text-sm font-bold text-ink">{label}</Text>
            <Text className="text-sm text-ink-muted">{minutes} mins / day</Text>
          </View>
        </View>
        <View
          className="h-6 w-6 items-center justify-center rounded-full border-2"
          style={{
            borderColor: selected ? colors.primary : colors.border,
          }}>
          {selected ? (
            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.primary }} />
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}
