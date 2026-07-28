import React, { forwardRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { colors } from '../../theme/tokens';

type FloatingInputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  hint?: string;
  labelRight?: React.ReactNode;
  style?: TextStyle;
};

export const FloatingInput = forwardRef<TextInput, FloatingInputProps>(
  function FloatingInput(
    {
      label,
      error,
      hint,
      labelRight,
      value,
      secureTextEntry,
      onFocus,
      onBlur,
      style,
      editable = true,
      autoCorrect = false,
      ...props
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(Boolean(secureTextEntry));

    const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

    return (
      <View className="mb-4">
        <View className="mb-2 ml-4 mr-4 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-ink-muted">{label}</Text>
          {labelRight}
        </View>

        <View style={styles.shell}>
          <TextInput
            ref={ref}
            placeholderTextColor={colors.inkFaint}
            {...props}
            value={value}
            editable={editable}
            autoCorrect={autoCorrect}
            secureTextEntry={secureTextEntry && hidden}
            showSoftInputOnFocus
            underlineColorAndroid="transparent"
            style={[
              styles.input,
              secureTextEntry ? styles.inputWithToggle : null,
              { borderColor },
              focused && !error ? styles.inputFocused : null,
              style,
            ]}
            onFocus={e => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={e => {
              setFocused(false);
              onBlur?.(e);
            }}
          />
          {secureTextEntry ? (
            <Pressable
              style={styles.toggle}
              onPress={() => setHidden(v => !v)}
              hitSlop={8}
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
  },
);

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    width: '100%',
  },
  input: {
    height: 56,
    width: '100%',
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
    ...(Platform.OS === 'android'
      ? { textAlignVertical: 'center', includeFontPadding: false }
      : { paddingTop: 16, paddingBottom: 16 }),
  },
  inputWithToggle: {
    paddingRight: 52,
  },
  inputFocused: {
    borderWidth: 1,
    ...(Platform.OS === 'android'
      ? { elevation: 2 }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }),
  },
  toggle: {
    position: 'absolute',
    right: 16,
    top: 0,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
  },
});

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
