import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../../theme/tokens';

type FloatingInputProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  labelRight?: React.ReactNode;
};

export function FloatingInput({
  label,
  error,
  hint,
  labelRight,
  value,
  secureTextEntry,
  onFocus,
  onBlur,
  ...props
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View className="mb-4">
      <View className="mb-2 ml-4 mr-4 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-ink-muted">{label}</Text>
        {labelRight}
      </View>
      <View
        className="min-h-[52px] flex-row items-center rounded-full border bg-white px-5"
        style={{
          borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
        }}>
        <TextInput
          value={value}
          secureTextEntry={secureTextEntry && hidden}
          placeholderTextColor={colors.inkFaint}
          className="flex-1 text-base text-ink"
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHidden(v => !v)}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Text className="text-lg">{hidden ? '👁' : '🙈'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="mt-1.5 ml-4 text-sm font-medium text-ink">{error}</Text>
      ) : hint ? (
        <Text className="mt-1.5 ml-4 text-sm text-ink-muted">{hint}</Text>
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
            style={{ backgroundColor: i <= score ? color : colors.borderLight }}
          />
        ))}
      </View>
      <Text className="mt-1 text-xs font-medium" style={{ color }}>
        {label} password
      </Text>
    </View>
  );
}
