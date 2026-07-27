import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { buttonShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type OnboardingFooterProps = {
  label?: string;
  hint?: string | null;
  loading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
  variant?: 'default' | 'pill' | 'dark';
  onPress: () => void;
};

export function OnboardingFooter({
  label = 'Continue',
  hint = 'You can change this later in Settings',
  loading,
  disabled,
  showArrow = false,
  variant = 'default',
  onPress,
}: OnboardingFooterProps) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const isDisabled = disabled || loading;
  const isPill = variant === 'pill';
  const isDark = variant === 'dark';

  const buttonBg = isDisabled
    ? colors.surfaceContainerHighest
    : isDark
      ? colors.ink
      : isPill
        ? colors.accentPill
        : colors.secondaryContainer;

  const buttonText = isDisabled
    ? colors.inkMuted
    : isDark
      ? colors.surface
      : isPill
        ? colors.ink
        : colors.onSecondaryContainer;

  return (
    <View
      className="bg-canvas pt-4"
      style={{
        paddingHorizontal: horizontalPadding,
        paddingBottom: Math.max(insets.bottom, 16),
      }}>
      <View className="mx-auto w-full" style={{ maxWidth: contentMaxWidth }}>
        <Pressable
          onPress={onPress}
          disabled={isDisabled}
          accessibilityRole="button"
          className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-full"
          style={[
            { backgroundColor: buttonBg },
            isDisabled || isPill ? undefined : buttonShadow(),
            isDark && !isDisabled ? buttonShadow() : undefined,
          ]}>
          {loading ? (
            <ActivityIndicator color={buttonText} />
          ) : (
            <>
              <Text className="text-sm font-bold" style={{ color: buttonText }}>
                {label}
              </Text>
              {showArrow && !isDisabled ? (
                <Text className="text-lg" style={{ color: buttonText }}>
                  {isDark ? '💬' : '→'}
                </Text>
              ) : null}
            </>
          )}
        </Pressable>
        {hint ? (
          <Text className="mt-4 text-center text-xs font-medium text-ink-muted">{hint}</Text>
        ) : null}
      </View>
    </View>
  );
}
