import React from 'react';
import { Pressable, Text, View } from 'react-native';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function AppHeader({ title, subtitle, onBack, right }: AppHeaderProps) {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <View className="flex-1 flex-row items-center gap-2">
        {onBack ? (
          <Pressable
            onPress={onBack}
            className="mr-1 h-10 w-10 items-center justify-center rounded-xl border-2 border-lavender bg-canvas">
            <Text className="text-lg font-bold text-ink">←</Text>
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-2xl font-extrabold text-ink">{title}</Text>
          {subtitle ? (
            <Text className="text-sm text-ink-muted">{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {right}
    </View>
  );
}
