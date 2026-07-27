import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { rowStyle, selectedRowStyle } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type SelectionRowProps = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  selected?: boolean;
  onPress: () => void;
};

export function SelectionRow({
  title,
  subtitle,
  leading,
  selected = false,
  onPress,
}: SelectionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="mb-3 min-h-[56px] flex-row items-center px-4 py-3"
      style={selected ? selectedRowStyle : rowStyle}>
      {leading ? <View className="mr-3">{leading}</View> : null}
      <View className="flex-1">
        <Text className="text-base font-semibold text-ink">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-sm text-ink-muted">{subtitle}</Text>
        ) : null}
      </View>
      {selected ? (
        <View
          className="h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primary }}>
          <Text className="text-xs font-bold text-white">✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
