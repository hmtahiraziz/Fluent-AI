import React from 'react';
import { Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { colors } from '../../theme/tokens';

type LanguageOptionCardProps = {
  label: string;
  nativeLabel?: string;
  flag: string;
  selected?: boolean;
  embedded?: boolean;
  onPress: () => void;
  trailing?: React.ReactNode;
};

export function LanguageOptionCard({
  label,
  nativeLabel,
  flag,
  selected = false,
  embedded = false,
  onPress,
  trailing,
}: LanguageOptionCardProps) {
  return (
    <PressableScale onPress={onPress}>
      <View
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={`flex-row items-center rounded-[20px] ${embedded ? 'p-4' : 'p-4'}`}
        style={{
          minHeight: embedded ? 68 : 72,
          backgroundColor: selected ? colors.primarySoft : colors.surfaceContainer,
        }}>
        <View
          className="mr-3.5 items-center justify-center overflow-hidden rounded-full"
          style={{
            width: 44,
            height: 44,
            backgroundColor: selected ? colors.surface : colors.surfaceContainerHighest,
          }}>
          <Text className="text-2xl">{flag}</Text>
        </View>
        <View className="min-w-0 flex-1 pr-2">
          <Text className="text-base font-semibold text-ink" numberOfLines={1}>
            {label}
          </Text>
          {nativeLabel ? (
            <Text className="mt-0.5 text-sm text-ink-muted" numberOfLines={1}>
              {nativeLabel}
            </Text>
          ) : null}
        </View>
        {trailing ?? (
          <SelectionCheck selected={selected} />
        )}
      </View>
    </PressableScale>
  );
}

function SelectionCheck({ selected }: { selected: boolean }) {
  return (
    <View
      className="h-6 w-6 items-center justify-center rounded-full"
      style={{
        backgroundColor: selected ? colors.secondaryContainer : 'transparent',
      }}>
      {selected ? (
        <Text className="text-xs font-bold" style={{ color: colors.onSecondaryContainer }}>
          ✓
        </Text>
      ) : (
        <View
          className="h-6 w-6 rounded-full"
          style={{ backgroundColor: colors.surfaceContainerHighest }}
        />
      )}
    </View>
  );
}

type OtherLanguagesCardProps = {
  selectedLabel?: string;
  selectedNativeLabel?: string;
  selectedFlag?: string;
  selected?: boolean;
  onPress: () => void;
};

export function OtherLanguagesCard({
  selectedLabel,
  selectedNativeLabel,
  selectedFlag,
  selected = false,
  onPress,
}: OtherLanguagesCardProps) {
  const hasSelection = Boolean(selectedLabel);

  return (
    <LanguageOptionCard
      label={hasSelection ? selectedLabel! : 'Other languages'}
      nativeLabel={
        hasSelection ? selectedNativeLabel : 'Urdu, Arabic, Hindi, and more'
      }
      flag={hasSelection ? selectedFlag! : '🌍'}
      selected={selected}
      onPress={onPress}
      trailing={
        hasSelection && selected ? (
          <SelectionCheck selected />
        ) : (
          <Text className="text-xl font-medium text-ink-faint">›</Text>
        )
      }
    />
  );
}
