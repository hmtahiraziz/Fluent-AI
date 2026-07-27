import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { CEFR_DESCRIPTIONS, type CefrLevel } from '../../config/constants';
import { softShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

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
          <PressableScale key={level} onPress={() => onSelect(level)}>
            <View
              className="mr-3 w-[200px] rounded-[24px] p-4"
              style={[
                softShadow(),
                {
                  borderWidth: active ? 1.5 : 0,
                  borderColor: active ? colors.primaryContainer : 'transparent',
                  backgroundColor: active ? colors.surfaceContainer : colors.surface,
                },
              ]}>
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
  return (
    <View className="mb-4 overflow-hidden rounded-[24px] bg-white" style={softShadow()}>
      <View className="border-b px-6 py-4" style={{ borderColor: colors.surfaceContainer }}>
        <Text className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          {title}
        </Text>
      </View>
      <View className="p-2">{children}</View>
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
    <View className="flex-row items-center justify-between rounded-xl px-4 py-4">
      <View className="flex-1 flex-row items-center gap-4">
        <Text className="text-xl" style={{ color: colors.primary }}>
          {icon}
        </Text>
        <Text className="text-base text-ink">{label}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        {value ? (
          <Text className="text-sm font-medium text-ink-faint">{value}</Text>
        ) : null}
        {onPress ? <Text className="text-lg text-ink-faint">›</Text> : null}
      </View>
    </View>
  );

  if (onPress) {
    return <PressableScale onPress={onPress}>{content}</PressableScale>;
  }
  return content;
}

type StatCardProps = {
  icon: string;
  value: string;
  label: string;
};

export function ProfileStatCard({ icon, value, label }: StatCardProps) {
  return (
    <View
      className="flex-1 items-center rounded-[24px] p-6"
      style={[{ backgroundColor: colors.surface }, softShadow()]}>
      <Text className="mb-2 text-2xl" style={{ color: colors.secondary }}>
        {icon}
      </Text>
      <Text className="text-2xl font-bold text-ink">{value}</Text>
      <Text className="mt-1 text-xs font-medium text-ink-muted">{label}</Text>
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
