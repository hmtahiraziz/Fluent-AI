import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/tokens';

type FloatingInputProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
};

export function FloatingInput({
  label,
  error,
  hint,
  value,
  secureTextEntry,
  onFocus,
  onBlur,
  ...props
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const focusAnim = useSharedValue(0);
  const hasValue = Boolean(value && String(value).length > 0);
  const floated = focused || hasValue;

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? colors.danger
      : focusAnim.value
        ? colors.primary
        : colors.border,
  }));

  return (
    <View className="mb-4">
      <Animated.View
        className="min-h-[56px] justify-center rounded-2xl border-2 bg-surface px-4"
        style={borderStyle}>
        <Text
          className="absolute left-4 text-sm font-semibold"
          style={{
            top: floated ? 8 : 18,
            fontSize: floated ? 12 : 16,
            color: error ? colors.danger : floated ? colors.primary : colors.inkMuted,
          }}>
          {label}
        </Text>
        <TextInput
          value={value}
          secureTextEntry={secureTextEntry && hidden}
          placeholderTextColor={colors.inkFaint}
          className="pt-4 text-base text-ink"
          onFocus={e => {
            setFocused(true);
            focusAnim.value = withTiming(1, { duration: 150 });
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            focusAnim.value = withTiming(0, { duration: 150 });
            onBlur?.(e);
          }}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHidden(v => !v)}
            className="absolute right-3 top-4 p-1"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Text className="text-lg">{hidden ? '👁' : '🙈'}</Text>
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? (
        <Text className="mt-1.5 text-sm font-medium text-coral">{error}</Text>
      ) : hint ? (
        <Text className="mt-1.5 text-sm text-ink-muted">{hint}</Text>
      ) : null}
    </View>
  );
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: colors.danger };
  if (score <= 3) return { score: 2, label: 'Fair', color: colors.gold };
  return { score: 3, label: 'Strong', color: colors.success };
}

export function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = getPasswordStrength(password);
  return (
    <View className="mb-4 -mt-2">
      <View className="flex-row gap-1">
        {[1, 2, 3].map(i => (
          <View
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: i <= score ? color : colors.border }}
          />
        ))}
      </View>
      <Text className="mt-1 text-xs font-medium" style={{ color }}>
        {label} password
      </Text>
    </View>
  );
}
