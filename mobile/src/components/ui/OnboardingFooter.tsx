import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../Button';
import { useResponsive } from '../../hooks/useResponsive';
import { bottomChromePadding } from '../../theme/safeArea';
import { colors } from '../../theme/tokens';

type OnboardingFooterProps = {
  label?: string;
  hint?: string | null;
  loading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
  variant?: 'default' | 'pill' | 'dark';
  onPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  /** When false, parent already applied bottom safe-area padding */
  includeSafeArea?: boolean;
};

export function OnboardingFooter({
  label = 'Continue',
  hint = 'You can change this later in Settings',
  loading,
  disabled,
  showArrow = false,
  variant = 'pill',
  onPress,
  secondaryLabel,
  onSecondaryPress,
  includeSafeArea = true,
}: OnboardingFooterProps) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const buttonVariant = variant === 'dark' ? 'dark' : 'lavender';
  const title = showArrow && !disabled && !loading ? `${label}  →` : label;

  return (
    <View
      style={{
        backgroundColor: colors.canvas,
        paddingTop: 14,
        paddingHorizontal: horizontalPadding,
        paddingBottom: includeSafeArea
          ? bottomChromePadding(insets.bottom)
          : 12,
        flexShrink: 0,
      }}>
      <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}>
        <Button
          title={title}
          variant={buttonVariant}
          loading={loading}
          disabled={disabled}
          onPress={onPress}
        />
        {secondaryLabel && onSecondaryPress ? (
          <Pressable
            onPress={onSecondaryPress}
            accessibilityRole="button"
            className="mt-2 min-h-[48px] items-center justify-center rounded-full"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              backgroundColor: pressed ? colors.surfaceContainer : 'transparent',
            })}>
            <Text className="text-base font-semibold text-brand">{secondaryLabel}</Text>
          </Pressable>
        ) : null}
        {hint ? (
          <Text className="mt-3 text-center text-xs font-medium leading-4 text-ink-muted">
            {hint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
