import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';
import { colors } from '../theme/tokens';

type Variant =
  | 'primary'
  | 'secondary'
  | 'lavender'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'light'
  | 'dark';

type ButtonProps = PressableProps & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  className?: string;
};

const variants: Record<Variant, string> = {
  primary: 'bg-accent-pill',
  secondary: 'bg-secondary-container',
  lavender: 'bg-accent-pill',
  outline: 'bg-surface-container',
  ghost: 'bg-transparent',
  danger: 'bg-coral',
  light: 'bg-surface',
  dark: 'bg-nav',
};

const textVariants: Record<Variant, string> = {
  primary: 'text-ink',
  secondary: 'text-secondary-onContainer',
  lavender: 'text-ink',
  outline: 'text-ink',
  ghost: 'text-brand',
  danger: 'text-white',
  light: 'text-brand',
  dark: 'text-white',
};

export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === 'outline' || variant === 'ghost' || variant === 'light'
      ? colors.primary
      : variant === 'lavender' || variant === 'primary'
        ? colors.ink
        : '#fff';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`min-h-[52px] items-center justify-center rounded-full px-6 py-3.5 ${variants[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      style={({ pressed }) => [
        pressed && !isDisabled ? { opacity: 0.9 } : undefined,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text className={`text-center text-lg font-bold ${textVariants[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
