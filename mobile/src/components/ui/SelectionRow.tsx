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
      className="mb-3 min-h-[72px] flex-row items-center px-5 py-4"
      style={selected ? selectedRowStyle : rowStyle}>
      {leading ? (
        <View
          className="mr-4 h-12 w-12 items-center justify-center overflow-hidden rounded-full"
          style={{ backgroundColor: colors.surfaceContainer }}>
          {leading}
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-lg font-medium text-ink">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-sm text-ink-muted">{subtitle}</Text>
        ) : null}
      </View>
      {selected ? (
        <Text className="text-2xl text-brand">✓</Text>
      ) : null}
    </Pressable>
  );
}
