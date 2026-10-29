import React from 'react';
import { Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
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
  embedded: _embedded = false,
  onPress,
}: DailyGoalOptionCardProps) {
  return (
    <PressableScale onPress={onPress}>
      <View
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className="flex-row items-center justify-between rounded-[20px] p-4"
        style={{
          backgroundColor: selected ? colors.primarySoft : colors.surfaceContainer,
        }}>
        <View className="flex-row items-center gap-3.5">
          <View
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{
              backgroundColor: selected ? colors.surface : colors.surfaceContainerHighest,
            }}>
            <Text className="text-xl">{icon}</Text>
          </View>
          <View>
            <Text className="text-base font-semibold text-ink">{label}</Text>
            <Text className="mt-0.5 text-sm text-ink-muted">{minutes} mins / day</Text>
          </View>
        </View>
        <View
          className="h-6 w-6 items-center justify-center rounded-full"
          style={{
            backgroundColor: selected
              ? colors.secondaryContainer
              : colors.surfaceContainerHighest,
          }}>
          {selected ? (
            <View
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors.onSecondaryContainer }}
            />
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}
