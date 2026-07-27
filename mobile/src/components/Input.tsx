import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../theme/tokens';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-ink-muted">{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkFaint}
        className={`rounded-xl border bg-surface px-4 py-3.5 text-base text-ink ${
          error ? 'border-coral' : 'border-border focus:border-brand'
        } ${className}`}
        {...props}
      />
      {error ? (
        <Text className="mt-1.5 text-sm font-semibold text-coral">{error}</Text>
      ) : null}
    </View>
  );
}
