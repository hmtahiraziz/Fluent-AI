import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { APP_NAME } from '../../theme/tokens';
import { AppIconMark } from './AppIconMark';

type FluentAILogoProps = {
  variant?: 'full' | 'compact' | 'wordmark';
  showIcon?: boolean;
  iconSize?: number;
  style?: ViewStyle;
};

export function FluentAILogo({
  variant = 'full',
  showIcon = variant !== 'wordmark',
  iconSize,
  style,
}: FluentAILogoProps) {
  const resolvedIconSize =
    iconSize ?? (variant === 'compact' ? 32 : variant === 'full' ? 56 : 0);
  const titleSize =
    variant === 'compact' ? 'text-xl' : variant === 'full' ? 'text-3xl' : 'text-2xl';

  return (
    <View
      accessibilityRole="header"
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>
      {showIcon && resolvedIconSize > 0 ? (
        <AppIconMark size={resolvedIconSize} />
      ) : null}
      <View>
        <Text className={`${titleSize} font-extrabold text-ink`}>
          Fluent
          <Text className={`${titleSize} font-extrabold text-accent`}>AI</Text>
        </Text>
        {variant === 'full' ? (
          <Text className="mt-0.5 text-sm font-medium text-ink-muted">
            Your personal language tutor
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function FluentAIWordmark({ className = '' }: { className?: string }) {
  return (
    <Text className={`font-extrabold text-ink ${className}`} accessibilityLabel={APP_NAME}>
      Fluent<Text className={`font-extrabold text-accent ${className}`}>AI</Text>
    </Text>
  );
}
