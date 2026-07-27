import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buttonShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type OnboardingFooterProps = {
  label?: string;
  step: number;
  total: number;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function OnboardingFooter({
  label = 'Continue',
  step,
  total,
  loading,
  disabled,
  onPress,
}: OnboardingFooterProps) {
  const insets = useSafeAreaInsets();
  const isDisabled = disabled || loading;

  return (
    <View
      className="border-t border-border/60 bg-surface px-5 pt-4"
      style={{ paddingBottom: Math.max(insets.bottom, 16), ...buttonShadow() }}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        className={`min-h-[56px] flex-row items-center justify-between rounded-[28px] px-5 ${
          isDisabled ? 'opacity-50' : ''
        }`}
        style={{ backgroundColor: colors.lavender }}>
        <Text className="text-base font-bold text-ink">{label}</Text>
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.ink }}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-lg font-bold text-white">→</Text>
          )}
        </View>
      </Pressable>
      <View className="mt-4 flex-row items-center justify-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            className="h-2 rounded-full"
            style={{
              width: i + 1 === step ? 20 : 8,
              backgroundColor: i + 1 <= step ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}
