import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ONBOARDING_STEPS } from '../../config/constants';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingStackParamList } from '../../navigation/types';
import { useResponsive } from '../../hooks/useResponsive';
import { SplitHeadline } from './SplitHeadline';
import { OnboardingFooter } from './OnboardingFooter';
import { colors, spacing } from '../../theme/tokens';

const PREVIOUS_STEP_ROUTE: Record<number, keyof OnboardingStackParamList> = {
  2: 'NativeLanguage',
  3: 'TargetLanguage',
  4: 'Motivation',
  5: 'Level',
  6: 'DailyGoal',
};

type OnboardingShellProps = {
  step: number;
  titlePrimary?: string;
  titleAccent?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footerLabel?: string;
  footerHint?: string | null;
  footerLoading?: boolean;
  footerDisabled?: boolean;
  footerShowArrow?: boolean;
  footerVariant?: 'default' | 'pill' | 'dark';
  footerPlacement?: 'sticky' | 'scroll';
  /** @deprecated Progress is always shown in the header */
  inlineHeaderProgress?: boolean;
  centerTitle?: boolean;
  onContinue: () => void;
  showBack?: boolean;
  /** @deprecated Step label is always centered */
  centerStepLabel?: boolean;
  footerExtra?: React.ReactNode;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
};

export function OnboardingShell({
  step,
  titlePrimary,
  titleAccent,
  title,
  subtitle,
  children,
  footerLabel,
  footerHint,
  footerLoading,
  footerDisabled,
  footerShowArrow,
  footerVariant = 'pill',
  footerPlacement = 'sticky',
  centerTitle = false,
  onContinue,
  showBack,
  footerExtra,
  secondaryLabel,
  onSecondaryPress,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { updateDraft } = useOnboarding();
  const { horizontalPadding, contentMaxWidth, isTablet, isCompact } = useResponsive();
  const progress = Math.min(100, Math.max(0, (step / ONBOARDING_STEPS) * 100));
  const previousRoute = PREVIOUS_STEP_ROUTE[step];
  const backVisible = showBack ?? step > 1;
  const scrollFooter = footerPlacement === 'scroll';
  const titleAlign = centerTitle ? 'center' : 'left';
  const sideSlot = isCompact ? 64 : 76;

  function handleBack() {
    if (!previousRoute) return;
    updateDraft({ step: step - 1 });
    navigation.navigate(previousRoute);
  }

  const footer = (
    <OnboardingFooter
      label={footerLabel}
      hint={footerHint}
      loading={footerLoading}
      disabled={footerDisabled}
      showArrow={footerShowArrow}
      variant={footerVariant}
      onPress={onContinue}
      secondaryLabel={secondaryLabel}
      onSecondaryPress={onSecondaryPress}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View
        style={{
          backgroundColor: colors.canvas,
          paddingTop: Math.max(insets.top, 12) + 8,
          paddingHorizontal: horizontalPadding,
          paddingBottom: spacing.md,
          flexShrink: 0,
        }}>
        <View className="flex-row items-center" style={{ minHeight: 44 }}>
          <View style={{ width: sideSlot, alignItems: 'flex-start' }}>
            {backVisible ? (
              <Pressable
                onPress={handleBack}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                className="h-10 flex-row items-center justify-center rounded-full px-3"
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? colors.surfaceContainerHighest
                    : colors.surfaceContainer,
                })}>
                <Text className="text-sm font-bold text-brand">← Back</Text>
              </Pressable>
            ) : null}
          </View>

          <View className="flex-1 items-center px-1">
            <Text className="text-sm font-semibold text-ink-muted" numberOfLines={1}>
              Step {step} of {ONBOARDING_STEPS}
            </Text>
          </View>

          <View style={{ width: sideSlot }} />
        </View>

        <View
          className="mt-3 h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: colors.surfaceContainerHighest }}>
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: colors.secondaryContainer,
            }}
          />
        </View>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={scrollFooter ? 24 : 12}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: horizontalPadding,
          paddingTop: isCompact ? spacing.md : spacing.lg,
          paddingBottom: scrollFooter ? spacing.sm : spacing.md,
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
        }}>
        <View className={titleAlign === 'center' ? 'items-center' : undefined}>
          {title ? (
            <Text
              className={`font-extrabold text-ink ${
                titleAlign === 'center' ? 'text-center' : ''
              } ${isTablet ? 'text-[32px] leading-10' : isCompact ? 'text-[24px] leading-8' : 'text-[28px] leading-9'}`}>
              {title}
            </Text>
          ) : (
            <SplitHeadline
              primary={titlePrimary ?? ''}
              accent={titleAccent ?? ''}
              size={isCompact ? 'lg' : 'xl'}
              align={titleAlign}
            />
          )}
          {subtitle ? (
            <Text
              className={`mt-3 text-base leading-6 text-ink-muted ${
                titleAlign === 'center' ? 'max-w-[320px] text-center' : ''
              }`}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View className="mt-7">{children}</View>

        {footerExtra ? <View className="mt-6">{footerExtra}</View> : null}

        {scrollFooter ? <View className="mt-6">{footer}</View> : null}
      </KeyboardAwareScrollView>

      {!scrollFooter ? (
        <KeyboardStickyView
          offset={{ closed: 0, opened: 0 }}
          style={{
            flexShrink: 0,
            backgroundColor: colors.canvas,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.borderLight,
          }}>
          {footer}
        </KeyboardStickyView>
      ) : null}
    </View>
  );
}
