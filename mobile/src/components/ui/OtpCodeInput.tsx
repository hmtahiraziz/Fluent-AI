import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../../theme/tokens';

const CODE_LENGTH = 6;

type OtpCodeInputProps = {
  value: string;
  onChange: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
  editable?: boolean;
};

export function OtpCodeInput({
  value,
  onChange,
  error,
  autoFocus = true,
  editable = true,
}: OtpCodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.padEnd(CODE_LENGTH, ' ').slice(0, CODE_LENGTH).split('');
  const activeIndex = Math.min(value.length, CODE_LENGTH - 1);

  useEffect(() => {
    if (!autoFocus) return;
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, [autoFocus]);

  function focusInput() {
    if (!editable) return;
    inputRef.current?.focus();
  }

  return (
    <View className="mb-6">
      <Text className="mb-3 text-center text-sm font-bold text-ink-muted">
        Verification code
      </Text>

      {/*
        Keep the real TextInput bounded to the digit row so KeyboardAwareScrollView
        scrolls this field (not the whole block) above the keyboard.
      */}
      <View style={styles.digitRow}>
        <Pressable onPress={focusInput} accessibilityRole="none">
          <View className="w-full flex-row justify-between gap-2">
            {digits.map((digit, index) => {
              const isFilled = digit !== ' ';
              const isActive =
                focused && index === activeIndex && value.length < CODE_LENGTH;
              const isCompleteActive =
                focused &&
                value.length === CODE_LENGTH &&
                index === CODE_LENGTH - 1;
              const highlight = isActive || isCompleteActive;

              return (
                <View
                  key={index}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: error
                        ? '#fce8e8'
                        : highlight
                          ? colors.surfaceContainer
                          : colors.surfaceContainerLow,
                      borderColor: error
                        ? colors.danger
                        : highlight
                          ? colors.primary
                          : 'transparent',
                    },
                    highlight && !error ? styles.cellActive : null,
                  ]}>
                  <Text
                    style={[
                      styles.digit,
                      { color: isFilled ? colors.ink : colors.inkFaint },
                    ]}>
                    {isFilled ? digit : '·'}
                  </Text>
                </View>
              );
            })}
          </View>
        </Pressable>

        <TextInput
          ref={inputRef}
          value={value}
          editable={editable}
          autoFocus={autoFocus}
          caretHidden
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          importantForAutofill="yes"
          maxLength={CODE_LENGTH}
          returnKeyType="done"
          blurOnSubmit={false}
          underlineColorAndroid="transparent"
          style={styles.hiddenInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={text => {
            onChange(text.replace(/\D/g, '').slice(0, CODE_LENGTH));
          }}
          accessibilityLabel="Six-digit verification code"
        />
      </View>

      {error ? (
        <Text className="mt-3 text-center text-sm font-medium text-danger">
          {error}
        </Text>
      ) : (
        <Text className="mt-3 text-center text-sm text-ink-muted">
          Enter the 6-digit code from your email
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  digitRow: {
    position: 'relative',
    width: '100%',
    height: 56,
    justifyContent: 'center',
  },
  cell: {
    flex: 1,
    maxWidth: 52,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  digit: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  hiddenInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 56,
    opacity: 0.02,
    color: 'transparent',
  },
});
