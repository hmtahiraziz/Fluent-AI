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
    iconSize ?? (variant === 'compact' ? 36 : variant === 'full' ? 56 : 0);
  const titleSize =
    variant === 'compact' ? 'text-2xl' : variant === 'full' ? 'text-3xl' : 'text-2xl';

  return (
    <View
      accessibilityRole="header"
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>
      {showIcon && resolvedIconSize > 0 ? (
        <AppIconMark size={resolvedIconSize} />
      ) : null}
      <View>
        <Text className={`${titleSize} font-extrabold text-ink`}>FluentAI</Text>
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
      FluentAI
    </Text>
  );
}

/** Compact icon + name row for headers and auth screens */
export function FluentAIBrand({
  iconSize = 40,
  style,
}: {
  iconSize?: number;
  style?: ViewStyle;
}) {
  return <FluentAILogo variant="compact" iconSize={iconSize} style={style} />;
}
