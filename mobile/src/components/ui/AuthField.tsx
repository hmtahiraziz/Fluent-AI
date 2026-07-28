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

type AuthFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  style?: TextStyle;
};

export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField(
  {
    label,
    error,
    secureTextEntry,
    style,
    editable = true,
    autoCorrect = false,
    ...props
  },
  ref,
) {
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
          ref={ref}
          placeholderTextColor={colors.inkFaint}
          {...props}
          editable={editable}
          autoCorrect={autoCorrect}
          secureTextEntry={isPassword && hidden}
          showSoftInputOnFocus
          underlineColorAndroid="transparent"
          style={[styles.input, style]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden(v => !v)}
            hitSlop={8}
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
});

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
    minHeight: 44,
    paddingVertical: Platform.OS === 'android' ? 8 : 14,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {}),
  },
});
