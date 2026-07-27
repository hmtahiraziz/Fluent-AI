import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../../theme/tokens';

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AuthField({ label, error, secureTextEntry, ...props }: AuthFieldProps) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const isPassword = Boolean(secureTextEntry);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-ink-muted">{label}</Text>
      <View
        className={`min-h-[52px] flex-row items-center rounded-2xl border bg-surface px-4 ${
          error ? 'border-coral' : 'border-border'
        }`}>
        <TextInput
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={isPassword && hidden}
          className="flex-1 py-3.5 text-base text-ink"
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden(v => !v)}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            className="px-2 py-1">
            <Text className="text-lg text-ink-muted">{hidden ? '👁' : '🙈'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="mt-1.5 text-sm font-semibold text-coral">{error}</Text>
      ) : null}
    </View>
  );
}
