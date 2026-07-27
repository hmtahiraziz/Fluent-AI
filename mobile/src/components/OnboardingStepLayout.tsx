import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import { FluentAILogo } from './brand/FluentAILogo';
import { OnboardingShell } from './ui/OnboardingShell';

type OnboardingStepLayoutProps = {
  step: number;
  titlePrimary: string;
  titleAccent: string;
  subtitle?: string;
  children: React.ReactNode;
  footerLabel?: string;
  footerLoading?: boolean;
  onContinue: () => void;
};

/** @deprecated Use OnboardingShell props directly in screen files */
export function OnboardingStepLayout({
  step,
  titlePrimary,
  titleAccent,
  subtitle,
  children,
  footerLabel,
  footerLoading,
  onContinue,
}: OnboardingStepLayoutProps) {
  return (
    <OnboardingShell
      step={step}
      titlePrimary={titlePrimary}
      titleAccent={titleAccent}
      subtitle={subtitle}
      footerLabel={footerLabel}
      footerLoading={footerLoading}
      onContinue={onContinue}>
      {children}
    </OnboardingShell>
  );
}
