import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/tokens';
import { softShadow } from '../../theme/glass';

type DailyGoalWidgetProps = {
  goalMinutes: number;
  completedMinutes: number;
  size?: 'compact' | 'regular';
};

const RING_SIZE = 88;
const STROKE_WIDTH = 8;
const RADIUS = 36;
const CENTER = RING_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DailyGoalWidget({
  goalMinutes,
  completedMinutes,
  size = 'regular',
}: DailyGoalWidgetProps) {
  const goal = Math.max(1, goalMinutes);
  const rawCompleted = Math.max(0, completedMinutes);
  const completed = Math.min(rawCompleted, goal);
  const pct = Math.min(100, Math.max(0, (completed / goal) * 100));
  const compact = size === 'compact';
  const strokeDashoffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const done = rawCompleted >= goal;

  return (
    <View
      className="flex-1 overflow-hidden rounded-[24px] p-4"
      style={[
        {
          backgroundColor: colors.surface,
          minHeight: compact ? 168 : 176,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        softShadow(1),
      ]}
      accessibilityLabel={`Daily goal ${rawCompleted} of ${goalMinutes} minutes${done ? ', complete' : ''}`}>
      <View
        className="absolute -right-6 -top-8 h-24 w-24 rounded-full"
        style={{ backgroundColor: 'rgba(90, 77, 190, 0.06)' }}
        pointerEvents="none"
      />

      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] font-extrabold uppercase tracking-wider text-brand">
          Daily Goal
        </Text>
        <View
          className="h-8 w-8 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-sm">🎯</Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center py-2">
        <View
          className="items-center justify-center"
          style={{ width: RING_SIZE, height: RING_SIZE }}>
          <Svg
            width={RING_SIZE}
            height={RING_SIZE}
            style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={colors.primarySoft}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={done ? colors.success : colors.secondary}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-xl font-extrabold text-ink">{Math.round(pct)}%</Text>
            <Text className="text-[10px] font-semibold text-ink-muted">today</Text>
          </View>
        </View>
      </View>

      <View
        className="rounded-[14px] px-3 py-2"
        style={{ backgroundColor: colors.surfaceContainerLow }}>
        <Text className="text-center text-sm font-extrabold text-ink">
          {rawCompleted} / {goalMinutes} min
        </Text>
        <Text className="mt-0.5 text-center text-[10px] font-medium text-ink-faint">
          {done ? 'Goal reached' : 'On this device'}
        </Text>
      </View>
    </View>
  );
}
