import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { buttonShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type OnboardingFooterProps = {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function OnboardingFooter({
  label = 'Continue',
  loading,
  disabled,
  onPress,
}: OnboardingFooterProps) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const isDisabled = disabled || loading;

  return (
    <View
      className="bg-canvas pt-4"
      style={{
        paddingHorizontal: horizontalPadding,
        paddingBottom: Math.max(insets.bottom, 16),
      }}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        className={`min-h-[52px] items-center justify-center rounded-full ${isDisabled ? 'opacity-50' : ''}`}
        style={[
          { backgroundColor: colors.accentPill },
          buttonShadow(),
        ]}>
        {loading ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <Text className="text-lg font-bold text-ink">{label}</Text>
        )}
      </Pressable>
    </View>
  );
}
