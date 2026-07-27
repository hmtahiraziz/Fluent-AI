import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { CEFR_DESCRIPTIONS, type CefrLevel } from '../../config/constants';
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
              className="mr-3 w-[200px] rounded-3xl border p-4"
              style={{
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.lavenderMuted : colors.surface,
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
  return (
    <View className="mb-6">
      <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-faint">
        {title}
      </Text>
      {children}
    </View>
  );
}

type SettingsRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
};

export function SettingsRow({ label, value, onPress }: SettingsRowProps) {
  const inner = (
    <View className="flex-row items-center justify-between rounded-2xl border border-border bg-surface px-4 py-4">
      <Text className="text-base font-medium text-ink">{label}</Text>
      <Text className="text-sm font-semibold text-ink-muted">{value ?? '›'}</Text>
    </View>
  );
  if (onPress) {
    return <PressableScale onPress={onPress}>{inner}</PressableScale>;
  }
  return inner;
}
