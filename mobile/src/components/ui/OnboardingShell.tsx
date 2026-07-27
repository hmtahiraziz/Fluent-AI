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
import { FluentAILogo } from '../brand/FluentAILogo';
import { SplitHeadline } from './SplitHeadline';
import { OnboardingFooter } from './OnboardingFooter';

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
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { horizontalPadding, contentMaxWidth } = useResponsive();

  return (
    <View className="flex-1 bg-mist">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          className="flex-row items-center justify-between px-5"
          style={{ paddingTop: insets.top + 8, paddingHorizontal: horizontalPadding }}>
          {showBack ? (
            <Pressable
              onPress={() => navigation.goBack()}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface"
              accessibilityLabel="Go back">
              <Text className="text-xl text-ink">←</Text>
            </Pressable>
          ) : (
            <View className="h-10 w-10" />
          )}
          <FluentAILogo variant="wordmark" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingTop: 16,
            paddingBottom: 24,
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <SplitHeadline primary={titlePrimary} accent={titleAccent} />
          {subtitle ? (
            <Text className="mb-6 mt-3 text-base leading-6 text-ink-muted">{subtitle}</Text>
          ) : (
            <View className="mb-6" />
          )}
          {children}
        </ScrollView>

        <OnboardingFooter
          label={footerLabel}
          step={step}
          total={ONBOARDING_STEPS}
          loading={footerLoading}
          disabled={footerDisabled}
          onPress={onContinue}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
