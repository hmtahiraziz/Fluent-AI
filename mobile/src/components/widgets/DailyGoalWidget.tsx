import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/tokens';
import { softShadow } from '../../theme/glass';

type DailyGoalWidgetProps = {
  minutes: number;
  progress?: number;
  size?: 'compact' | 'regular';
};

const RING_SIZE = 96;
const STROKE_WIDTH = 8;
const RADIUS = 40;
const CENTER = RING_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DailyGoalWidget({
  minutes,
  progress = 0,
  size = 'regular',
}: DailyGoalWidgetProps) {
  const pct = Math.min(100, Math.max(0, progress));
  const compact = size === 'compact';
  const completed = Math.round((pct / 100) * minutes);
  const strokeDashoffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  return (
    <View
      className={`flex-1 rounded-[24px] ${compact ? 'p-4' : 'p-5'}`}
      style={[
        {
          backgroundColor: colors.surface,
          minHeight: compact ? 160 : 180,
        },
        softShadow(),
      ]}>
      <Text className="self-start text-xs font-medium text-ink-muted">Daily Goal</Text>

      <View className="flex-1 items-center justify-center py-3">
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
              stroke={colors.surfaceContainerHighest}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={colors.secondary}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-2xl font-bold text-ink">{Math.round(pct)}%</Text>
          </View>
        </View>
      </View>

      <Text
        className="self-center text-xs font-medium"
        style={{ color: colors.accentDark }}>
        {completed} / {minutes} mins
      </Text>
    </View>
  );
}
