import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ONBOARDING_STEPS } from '../../config/constants';
import { useResponsive } from '../../hooks/useResponsive';
import { SplitHeadline } from './SplitHeadline';
import { OnboardingFooter } from './OnboardingFooter';
import { colors } from '../../theme/tokens';

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
  inlineHeaderProgress?: boolean;
  centerTitle?: boolean;
  onContinue: () => void;
  showBack?: boolean;
  centerStepLabel?: boolean;
  footerExtra?: React.ReactNode;
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
  footerVariant = 'default',
  footerPlacement = 'sticky',
  inlineHeaderProgress = false,
  centerTitle = false,
  onContinue,
  showBack,
  centerStepLabel = false,
  footerExtra,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { horizontalPadding, contentMaxWidth, isTablet } = useResponsive();
  const progress = (step / ONBOARDING_STEPS) * 100;
  const canGoBack = navigation.canGoBack();
  const backVisible = showBack ?? canGoBack;
  const scrollFooter = footerPlacement === 'scroll';

  const footer = (
    <OnboardingFooter
      label={footerLabel}
      hint={footerHint}
      loading={footerLoading}
      disabled={footerDisabled}
      showArrow={footerShowArrow}
      variant={footerVariant}
      onPress={onContinue}
    />
  );

  return (
    <View className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          className="flex-row items-center bg-canvas"
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: horizontalPadding,
            paddingBottom: 8,
            minHeight: 64,
          }}>
          {backVisible ? (
            <Pressable
              onPress={() => navigation.goBack()}
              className="h-10 w-10 items-center justify-center rounded-full"
              accessibilityLabel="Go back"
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.surfaceContainerHighest : 'transparent',
              })}>
              <Text className="text-2xl text-brand">←</Text>
            </Pressable>
          ) : (
            <View className="h-10 w-10" />
          )}

          {inlineHeaderProgress ? (
            <View className="flex-1 items-center">
              <Text className="text-sm font-bold text-brand">
                Step {step} of {ONBOARDING_STEPS}
              </Text>
              <View
                className="mt-2 h-1 w-32 overflow-hidden rounded-full"
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
          ) : centerStepLabel ? (
            <Text className="flex-1 text-center text-sm font-bold text-brand">
              Step {step} of {ONBOARDING_STEPS}
            </Text>
          ) : (
            <Text className="ml-4 text-sm font-bold text-brand">
              Step {step} of {ONBOARDING_STEPS}
            </Text>
          )}

          {inlineHeaderProgress || centerStepLabel ? <View className="h-10 w-10" /> : null}
        </View>

        {!inlineHeaderProgress ? (
          <View
            className="mt-2 h-1.5 overflow-hidden rounded-full"
            style={{
              marginHorizontal: horizontalPadding,
              backgroundColor: colors.surfaceContainerHighest,
            }}>
            <View
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: colors.secondaryContainer,
              }}
            />
          </View>
        ) : null}

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingTop: 32,
            paddingBottom: scrollFooter ? Math.max(insets.bottom, 24) : 160,
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className={centerTitle ? 'items-center' : undefined}>
            {title ? (
              <Text
                className={`font-bold text-ink ${centerTitle ? 'text-center' : ''} ${isTablet ? 'text-[32px] leading-10' : 'text-[28px] leading-9'}`}>
                {title}
              </Text>
            ) : (
              <View className={centerTitle ? 'items-center' : undefined}>
                <SplitHeadline
                  primary={titlePrimary ?? ''}
                  accent={titleAccent ?? ''}
                  size="xl"
                />
              </View>
            )}
            {subtitle ? (
              <Text
                className={`mb-8 mt-2 text-base leading-6 text-ink-muted ${centerTitle ? 'max-w-[280px] text-center' : ''}`}>
                {subtitle}
              </Text>
            ) : (
              <View className="mb-8" />
            )}
          </View>

          {children}
          {footerExtra}

          {scrollFooter ? (
            <View className="-mx-0 mt-8">{footer}</View>
          ) : null}
        </ScrollView>

        {!scrollFooter ? (
          <View className="absolute bottom-0 left-0 right-0 bg-canvas">{footer}</View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}
