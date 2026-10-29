import React from 'react';
import { Text, View } from 'react-native';
import type { CefrLevel } from '../../config/constants';
import { PressableScale } from './PressableScale';
import { colors } from '../../theme/tokens';

type CefrLevelCardProps = {
  level: CefrLevel;
  title: string;
  subtitle: string;
  selected?: boolean;
  compact?: boolean;
  onPress: () => void;
};

export function CefrLevelCard({
  level,
  title,
  subtitle,
  selected = false,
  compact = false,
  onPress,
}: CefrLevelCardProps) {
  return (
    <PressableScale onPress={onPress}>
      <View
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={`flex-row items-center rounded-[20px] ${compact ? 'p-4' : 'mb-3 p-4'}`}
        style={{
          backgroundColor: selected ? colors.primarySoft : colors.surfaceContainer,
        }}>
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{
            backgroundColor: selected ? colors.secondaryContainer : colors.surface,
          }}>
          <Text
            className="text-sm font-bold"
            style={{ color: selected ? colors.onSecondaryContainer : colors.primaryDark }}>
            {level}
          </Text>
        </View>
        <View className="ml-3.5 flex-1">
          <Text className="text-base font-semibold text-ink">{title}</Text>
          <Text className="mt-0.5 text-sm text-ink-muted">{subtitle}</Text>
        </View>
        <View
          className="h-6 w-6 items-center justify-center rounded-full"
          style={{
            backgroundColor: selected ? colors.secondaryContainer : colors.surfaceContainerHighest,
          }}>
          {selected ? (
            <Text className="text-xs font-bold" style={{ color: colors.onSecondaryContainer }}>
              ✓
            </Text>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}
