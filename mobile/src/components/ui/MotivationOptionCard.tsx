import React from 'react';
import { Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { softShadow } from '../../theme/glass';
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
        className={`rounded-[24px] border-2 p-6 ${isHorizontal ? 'flex-row items-center gap-4' : ''}`}
        style={[
          softShadow(),
          {
            backgroundColor: colors.surface,
            borderColor: selected ? colors.primaryContainer : 'transparent',
            minHeight: isHorizontal ? 88 : 160,
            justifyContent: isHorizontal ? 'center' : 'space-between',
          },
        ]}>
        <View
          className={`items-center justify-center rounded-2xl ${isHorizontal ? 'h-12 w-12' : 'mb-4 h-12 w-12'}`}
          style={{ backgroundColor: iconBackground }}>
          <Text className="text-2xl">{icon}</Text>
        </View>
        <View className={isHorizontal ? 'flex-1' : undefined}>
          <Text className="text-xl font-bold text-ink">{title}</Text>
          <Text className="mt-1 text-base leading-6 text-ink-muted">{description}</Text>
        </View>
      </View>
    </PressableScale>
  );
}
