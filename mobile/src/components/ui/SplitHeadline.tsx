import React from 'react';
import { Text, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { colors } from '../../theme/tokens';

type SplitHeadlineProps = {
  primary: string;
  accent: string;
  className?: string;
  size?: 'lg' | 'xl';
};

export function SplitHeadline({
  primary,
  accent,
  className = '',
  size = 'lg',
}: SplitHeadlineProps) {
  const { isTablet } = useResponsive();
  const textClass =
    size === 'xl'
      ? isTablet
        ? 'text-4xl leading-[48px]'
        : 'text-[28px] leading-9'
      : isTablet
        ? 'text-3xl leading-10'
        : 'text-2xl leading-8';

  return (
    <View className={className}>
      <Text className={`${textClass} font-extrabold text-ink`}>
        {primary}
        <Text style={{ color: colors.accent }}>{accent}</Text>
      </Text>
    </View>
  );
}
