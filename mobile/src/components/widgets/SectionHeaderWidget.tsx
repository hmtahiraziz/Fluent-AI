import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatPill } from '../StatPill';

type StatRowWidgetProps = {
  stats: { label: string; value: string; accent?: 'brand' | 'gold' | 'ocean' | 'accent' }[];
};

export function StatRowWidget({ stats }: StatRowWidgetProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {stats.map(s => (
        <StatPill
          key={s.label}
          label={s.label}
          value={s.value}
          accent={s.accent ?? 'brand'}
        />
      ))}
    </View>
  );
}

type SectionHeaderWidgetProps = {
  overline?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  titleClassName?: string;
};

export function SectionHeaderWidget({
  overline,
  title,
  actionLabel,
  onAction,
  titleClassName = 'text-xl',
}: SectionHeaderWidgetProps) {
  return (
    <View className="mb-4 flex-row items-end justify-between">
      <View className="flex-1">
        {overline ? (
          <Text className="mb-1 text-sm font-semibold text-ink-muted">{overline}</Text>
        ) : null}
        <Text className={`font-extrabold text-ink ${titleClassName}`}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} className="ml-3 py-1">
          <Text className="text-sm font-bold text-brand">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
