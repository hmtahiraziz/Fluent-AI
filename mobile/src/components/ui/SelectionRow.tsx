import React from 'react';
import { Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
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
  const avatarSize = isTarget ? 48 : 44;

  return (
    <PressableScale onPress={onPress} className="mb-0">
      <View
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className="flex-row items-center rounded-[20px] p-4"
        style={{
          minHeight: isTarget ? 80 : 72,
          backgroundColor: selected ? colors.primarySoft : colors.surfaceContainer,
        }}>
        {leading ? (
          <View
            className="mr-3.5 items-center justify-center overflow-hidden rounded-full"
            style={{
              width: avatarSize,
              height: avatarSize,
              backgroundColor: selected ? colors.surface : colors.surfaceContainerHighest,
            }}>
            {leading}
          </View>
        ) : null}
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-ink" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-sm text-ink-muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
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
      </View>
    </PressableScale>
  );
}
