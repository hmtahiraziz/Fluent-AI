import React from 'react';
import { Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { colors } from '../../theme/tokens';

type MotivationOptionCardProps = {
  title: string;
  description: string;
  icon: string;
  iconBackground: string;
  selected?: boolean;
  onPress: () => void;
  layout?: 'vertical' | 'horizontal';
};

export function MotivationOptionCard({
  title,
  description,
  icon,
  iconBackground,
  selected = false,
  onPress,
  layout = 'vertical',
}: MotivationOptionCardProps) {
  const isHorizontal = layout === 'horizontal';

  return (
    <PressableScale onPress={onPress}>
      <View
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={`rounded-[20px] p-4 ${isHorizontal ? 'flex-row items-center gap-3.5' : ''}`}
        style={{
          backgroundColor: selected ? colors.primarySoft : colors.surfaceContainer,
          minHeight: isHorizontal ? 80 : undefined,
        }}>
        <View
          className={`items-center justify-center rounded-2xl ${isHorizontal ? 'h-11 w-11' : 'mb-3 h-11 w-11'}`}
          style={{
            backgroundColor: selected ? colors.surface : iconBackground,
          }}>
          <Text className="text-xl">{icon}</Text>
        </View>
        <View className={isHorizontal ? 'min-w-0 flex-1' : undefined}>
          <Text className="text-base font-semibold text-ink">{title}</Text>
          <Text className="mt-1 text-sm leading-5 text-ink-muted">{description}</Text>
        </View>
        {isHorizontal ? (
          <View
            className="h-6 w-6 items-center justify-center rounded-full"
            style={{
              backgroundColor: selected
                ? colors.secondaryContainer
                : colors.surfaceContainerHighest,
            }}>
            {selected ? (
              <Text className="text-xs font-bold" style={{ color: colors.onSecondaryContainer }}>
                ✓
              </Text>
            ) : null}
          </View>
        ) : selected ? (
          <View
            className="absolute right-4 top-4 h-6 w-6 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.secondaryContainer }}>
            <Text className="text-xs font-bold" style={{ color: colors.onSecondaryContainer }}>
              ✓
            </Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}
