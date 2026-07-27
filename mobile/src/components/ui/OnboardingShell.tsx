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
  titlePrimary: string;
  titleAccent: string;
  subtitle?: string;
  children: React.ReactNode;
  footerLabel?: string;
  footerLoading?: boolean;
  footerDisabled?: boolean;
  onContinue: () => void;
  showBack?: boolean;
  footerExtra?: React.ReactNode;
};

export function OnboardingShell({
  step,
  titlePrimary,
  titleAccent,
  subtitle,
  children,
  footerLabel,
  footerLoading,
  footerDisabled,
  onContinue,
  showBack = step > 1,
  footerExtra,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const progress = (step / ONBOARDING_STEPS) * 100;

  return (
    <View className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          className="flex-row items-center"
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: horizontalPadding,
          }}>
          {showBack ? (
            <Pressable
              onPress={() => navigation.goBack()}
              className="h-10 w-10 items-center justify-center rounded-full"
              accessibilityLabel="Go back">
              <Text className="text-2xl text-brand">←</Text>
            </Pressable>
          ) : (
            <View className="h-10 w-10" />
          )}
          <Text className="ml-3 text-sm font-bold text-brand">
            Step {step} of {ONBOARDING_STEPS}
          </Text>
        </View>

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

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingTop: 24,
            paddingBottom: 24,
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <SplitHeadline primary={titlePrimary} accent={titleAccent} size="xl" />
          {subtitle ? (
            <Text className="mb-6 mt-3 text-base leading-6 text-ink-muted">{subtitle}</Text>
          ) : (
            <View className="mb-6" />
          )}
          {children}
          {footerExtra}
        </ScrollView>

        <OnboardingFooter
          label={footerLabel}
          loading={footerLoading}
          disabled={footerDisabled}
          onPress={onContinue}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
