import React from 'react';
import { Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { softShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type SelectionRowProps = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  selected?: boolean;
  onPress: () => void;
  variant?: 'native' | 'target';
};

export function SelectionRow({
  title,
  subtitle,
  leading,
  selected = false,
  onPress,
  variant = 'native',
}: SelectionRowProps) {
  const isTarget = variant === 'target';
  const avatarSize = isTarget ? 56 : 48;
  const selectedBorder = isTarget ? colors.secondary : colors.primaryContainer;
  const checkColor = isTarget ? colors.secondary : colors.primary;

  return (
    <PressableScale onPress={onPress} className="mb-0">
      <View
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className="flex-row items-center rounded-[24px] p-5"
        style={[
          softShadow(),
          {
            minHeight: isTarget ? 88 : 80,
            backgroundColor: selected ? colors.surfaceContainer : colors.surface,
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? selectedBorder : 'transparent',
          },
        ]}>
        {leading ? (
          <View
            className="mr-4 items-center justify-center overflow-hidden rounded-full"
            style={{
              width: avatarSize,
              height: avatarSize,
              backgroundColor: colors.surfaceContainer,
            }}>
            {leading}
          </View>
        ) : null}
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-medium text-ink" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-xs font-medium text-ink-muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text className="text-2xl" style={{ color: checkColor, opacity: selected ? 1 : 0 }}>
          ✓
        </Text>
      </View>
    </PressableScale>
  );
}
