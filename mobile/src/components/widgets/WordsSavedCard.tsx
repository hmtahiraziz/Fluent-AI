import React from 'react';
import { Text, View } from 'react-native';
import { PressableScale } from '../ui/PressableScale';
import { colors } from '../../theme/tokens';
import { softShadow } from '../../theme/glass';

type Props = {
  total: number;
  today: number;
  error?: string;
  onRetry?: () => void;
  onPress: () => void;
};

export function WordsSavedCard({
  total,
  today,
  error,
  onRetry,
  onPress,
}: Props) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Words saved, ${total} total${today > 0 ? `, ${today} today` : ''}`}>
      <View
        className="justify-between overflow-hidden rounded-[24px] p-4"
        style={[
          {
            backgroundColor: colors.surface,
            minHeight: 176,
            borderWidth: 1,
            borderColor: colors.borderLight,
          },
          softShadow(1),
        ]}>
        <View
          className="absolute -right-8 -bottom-10 h-28 w-28 rounded-full"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }}
          pointerEvents="none"
        />

        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] font-extrabold uppercase tracking-wider text-brand">
            Words Saved
          </Text>
          <View
            className="h-8 w-8 items-center justify-center rounded-[12px]"
            style={{ backgroundColor: colors.phraseCard }}>
            <Text className="text-sm">📖</Text>
          </View>
        </View>

        {error ? (
          <View className="mt-6">
            <Text className="text-sm font-semibold text-ink-muted">Couldn't load</Text>
            {onRetry ? (
              <PressableScale onPress={onRetry} accessibilityRole="button">
                <Text className="mt-2 text-sm font-extrabold text-brand">Retry</Text>
              </PressableScale>
            ) : null}
          </View>
        ) : (
          <View className="mt-3">
            <Text className="text-[36px] font-extrabold leading-none text-ink">
              {total.toLocaleString()}
            </Text>
            <Text className="mt-1.5 text-xs font-medium text-ink-muted">
              In your vocabulary library
            </Text>

            <View
              className="mt-4 self-start rounded-full px-3 py-1.5"
              style={{
                backgroundColor:
                  today > 0 ? colors.primarySoft : colors.surfaceContainerLow,
              }}>
              <Text
                className="text-xs font-extrabold"
                style={{
                  color: today > 0 ? colors.onPrimaryFixedVariant : colors.inkMuted,
                }}>
                {today > 0 ? `+${today} today` : 'Open library ›'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </PressableScale>
  );
}
