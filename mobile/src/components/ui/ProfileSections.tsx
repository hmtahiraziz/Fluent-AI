import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { CEFR_DESCRIPTIONS, type CefrLevel } from '../../config/constants';
import { colors } from '../../theme/tokens';
import { softShadow } from '../../theme/glass';

type LevelPickerProps = {
  selected: CefrLevel;
  levels: readonly CefrLevel[];
  onSelect: (level: CefrLevel) => void;
};

export function LevelPickerHorizontal({ selected, levels, onSelect }: LevelPickerProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
      {levels.map(level => {
        const active = selected === level;
        return (
          <PressableScale
            key={level}
            onPress={() => onSelect(level)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`CEFR level ${level}`}>
            <View
              className="mr-3 w-[200px] rounded-[20px] p-4"
              style={{
                backgroundColor: active ? colors.primarySoft : colors.surface,
                borderWidth: 1.5,
                borderColor: active ? colors.secondary : colors.borderLight,
              }}>
              <Text className="text-2xl font-extrabold text-ink">{level}</Text>
              <Text className="mt-2 text-sm leading-5 text-ink-muted" numberOfLines={3}>
                {CEFR_DESCRIPTIONS[level]}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

type ProfileSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function ProfileSection({ title, children }: ProfileSectionProps) {
  const items = React.Children.toArray(children);

  return (
    <View
      className="mb-4 overflow-hidden rounded-[22px]"
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        softShadow(1),
      ]}>
      <View className="px-5 pb-1.5 pt-4">
        <Text className="text-[11px] font-extrabold uppercase tracking-wider text-brand">
          {title}
        </Text>
      </View>
      <View className="px-2 pb-2">
        {items.map((child, index) => (
          <View key={index}>
            {child}
            {index < items.length - 1 ? (
              <View
                className="mx-4"
                style={{ height: 1, backgroundColor: colors.borderLight }}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

type SettingsRowProps = {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
};

export function SettingsRow({ icon, label, value, onPress }: SettingsRowProps) {
  const content = (
    <View className="min-h-[56px] flex-row items-center justify-between rounded-xl px-3 py-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-3.5">
        <View
          className="h-10 w-10 items-center justify-center rounded-[14px]"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-base">{icon}</Text>
        </View>
        <Text className="min-w-0 flex-1 text-base font-semibold text-ink">{label}</Text>
      </View>
      <View className="ml-2 max-w-[42%] flex-row items-center gap-1.5">
        {value ? (
          <Text
            className="text-sm font-medium text-ink-muted"
            numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {onPress ? (
          <Text className="text-lg font-bold" style={{ color: colors.secondary }}>
            ›
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}, ${value}` : label}>
        {content}
      </PressableScale>
    );
  }
  return content;
}

type StatCardProps = {
  icon: string;
  value: string;
  label: string;
  hint?: string;
};

export function ProfileStatCard({ icon, value, label, hint }: StatCardProps) {
  return (
    <View
      className="min-w-0 flex-1 rounded-[22px] p-4"
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderLight,
          minHeight: 118,
        },
        softShadow(1),
      ]}
      accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}>
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
          {label}
        </Text>
        <View
          className="h-8 w-8 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-sm">{icon}</Text>
        </View>
      </View>
      <Text className="mt-3 text-[26px] font-extrabold text-ink">{value}</Text>
      {hint ? (
        <Text className="mt-1 text-xs font-medium text-ink-muted">{hint}</Text>
      ) : null}
    </View>
  );
}

export function levelProgressPercent(level: CefrLevel): number {
  const map: Record<CefrLevel, number> = {
    A1: 20,
    A2: 35,
    B1: 55,
    B2: 85,
    C1: 95,
    C2: 100,
  };
  return map[level] ?? 50;
}

export function levelDisplayName(level: CefrLevel): string {
  const map: Record<CefrLevel, string> = {
    A1: 'Beginner',
    A2: 'Elementary',
    B1: 'Intermediate',
    B2: 'Upper Intermediate',
    C1: 'Advanced',
    C2: 'Proficient',
  };
  return map[level] ?? level;
}

export function nextMilestone(level: CefrLevel): string {
  const map: Record<CefrLevel, string> = {
    A1: 'Basic Conversations',
    A2: 'Daily Fluency',
    B1: 'Confident Speaker',
    B2: 'Fluent Speaker',
    C1: 'Near-Native',
    C2: 'Mastery',
  };
  return map[level] ?? 'Keep learning';
}
