import React from 'react';
import { Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { softShadow } from '../../theme/glass';
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
        className={`flex-row items-center rounded-[24px] ${embedded ? 'p-4' : 'p-5'}`}
        style={[
          embedded ? undefined : softShadow(),
          {
            minHeight: embedded ? 72 : 80,
            backgroundColor: embedded
              ? colors.surfaceContainerLow
              : selected
                ? colors.surfaceContainer
                : colors.surface,
            borderWidth: selected && !embedded ? 1.5 : 0,
            borderColor: selected ? colors.primaryContainer : 'transparent',
          },
        ]}>
        <View
          className="mr-4 items-center justify-center overflow-hidden rounded-full"
          style={{
            width: 48,
            height: 48,
            backgroundColor: colors.surfaceContainer,
          }}>
          <Text className="text-2xl">{flag}</Text>
        </View>
        <View className="min-w-0 flex-1 pr-2">
          <Text className="text-lg font-medium text-ink" numberOfLines={1}>
            {label}
          </Text>
          {nativeLabel ? (
            <Text className="mt-0.5 text-sm text-ink-muted" numberOfLines={1}>
              {nativeLabel}
            </Text>
          ) : null}
        </View>
        {trailing ?? (
          <Text
            className="text-2xl"
            style={{ color: colors.primaryContainer, opacity: selected ? 1 : 0 }}>
            ✓
          </Text>
        )}
      </View>
    </PressableScale>
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
          <Text className="text-2xl" style={{ color: colors.primaryContainer }}>
            ✓
          </Text>
        ) : (
          <Text className="text-xl text-ink-faint">›</Text>
        )
      }
    />
  );
}
