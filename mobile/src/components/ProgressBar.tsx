import React from 'react';
import { View } from 'react-native';

type ProgressBarProps = {
  step: number;
  total: number;
};

export function ProgressBar({ step, total }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  return (
    <View className="mb-6 h-2 w-full overflow-hidden rounded-full bg-border">
      <View
        className="h-full rounded-full bg-brand"
        style={{ width: `${pct}%` }}
      />
    </View>
  );
}
