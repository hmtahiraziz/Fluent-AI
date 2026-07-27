import React from 'react';
import { Text, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

type SplitHeadlineProps = {
  primary: string;
  accent: string;
  className?: string;
};

export function SplitHeadline({ primary, accent, className = '' }: SplitHeadlineProps) {
  const { sectionTitleClass } = useResponsive();
  return (
    <View className={className}>
      <Text className={`${sectionTitleClass} font-extrabold text-ink`}>{primary}</Text>
      <Text className={`${sectionTitleClass} font-extrabold text-lavender`}>{accent}</Text>
    </View>
  );
}
