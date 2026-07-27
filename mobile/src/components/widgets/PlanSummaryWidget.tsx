import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { LanguageMeta } from '../../config/constants';
import { colors } from '../../theme/tokens';

type PlanSummaryWidgetProps = {
  target: LanguageMeta;
  level: string;
  dailyMinutes: number;
  motivation?: string;
  checklist?: { label: string; done: boolean }[];
  loading?: boolean;
};

export function PlanSummaryWidget({
  target,
  level,
  dailyMinutes,
  motivation,
  checklist,
  loading,
}: PlanSummaryWidgetProps) {
  return (
    <View
      className="w-full rounded-2xl bg-surface p-5"
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}>
      <View className="mb-4 flex-row items-center gap-3">
        <Text className="text-4xl">{target.flag}</Text>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-ink">{target.label}</Text>
          <Text className="text-sm text-ink-muted">
            Level {level} · {dailyMinutes} min/day
          </Text>
        </View>
      </View>
      {motivation ? (
        <View className="mb-4 rounded-xl bg-brand/8 px-3 py-2">
          <Text className="text-sm font-medium text-brand-dark">
            Goal: {motivation}
          </Text>
        </View>
      ) : null}
      {checklist?.map(item => (
        <View key={item.label} className="mb-2 flex-row items-center gap-3">
          {item.done ? (
            <Text className="font-bold text-success">✓</Text>
          ) : loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View className="h-4 w-4 rounded-full bg-mist" />
          )}
          <Text className="text-base text-ink">{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
