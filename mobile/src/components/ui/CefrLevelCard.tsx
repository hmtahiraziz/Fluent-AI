import React from 'react';
import { Text, View } from 'react-native';
import type { CefrLevel } from '../../config/constants';
import { PressableScale } from './PressableScale';
import { softShadow } from '../../theme/glass';
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
        className={`flex-row items-center rounded-[24px] border ${compact ? 'p-4' : 'mb-4 p-5'}`}
        style={[
          compact ? undefined : softShadow(),
          {
            backgroundColor: selected ? colors.surfaceContainer : colors.surface,
            borderColor: selected ? colors.primaryContainer : compact ? colors.borderLight : 'transparent',
            borderWidth: selected ? 1.5 : compact ? 1 : 1,
          },
        ]}>
        <View
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-lg font-bold" style={{ color: colors.primaryDark }}>
            {level}
          </Text>
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-sm font-bold text-ink">{title}</Text>
          <Text className="mt-0.5 text-xs font-medium text-ink-muted">{subtitle}</Text>
        </View>
        <Text
          className="text-2xl"
          style={{ color: colors.primaryContainer, opacity: selected ? 1 : 0 }}>
          ✓
        </Text>
      </View>
    </PressableScale>
  );
}
