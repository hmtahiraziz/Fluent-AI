import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { AuthHeader } from '../../components/ui/AuthHeader';
import { ErrorCard } from '../../components/ui/ErrorCard';
import { AuthScreenLayout } from '../../components/ui/AuthScreenLayout';
import { FloatingInput, PasswordStrengthBar } from '../../components/ui/FloatingInput';
import { InsightCard } from '../../components/ui/InsightCard';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { useResponsive } from '../../hooks/useResponsive';
import { colors } from '../../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreateAccount'>;

export function CreateAccountScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [ageError, setAgeError] = useState('');

  function validate() {
    let ok = true;
    if (!email.includes('@')) {
      setEmailError('Enter a valid email address');
      ok = false;
    } else setEmailError('');
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      ok = false;
    } else setPasswordError('');
    if (!confirmPassword) {
      setConfirmError('Confirm your password');
      ok = false;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      ok = false;
    } else setConfirmError('');
    if (!ageConfirmed) {
      setAgeError('Confirm you are 13 or older to continue');
      ok = false;
    } else setAgeError('');
    return ok;
  }

  async function onSubmit() {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email.trim(), password, true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      horizontalPadding={horizontalPadding}
      contentMaxWidth={contentMaxWidth}
      header={
        <AuthHeader
          onBack={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Welcome');
          }}
          horizontalPadding={horizontalPadding}
        />
      }>
      <SplitHeadline
        className="mb-2"
        primary="Create your "
        accent="account"
        size="xl"
        align="left"
      />
      <Text className="mb-7 text-base leading-6 text-ink-muted">
        Join learners practicing with FluentAI.
      </Text>

      {error ? <ErrorCard message={error} onRetry={onSubmit} /> : null}
      <FloatingInput
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        placeholder="hello@example.com"
        value={email}
        onChangeText={t => {
          setEmail(t);
          if (emailError) setEmailError('');
        }}
        error={emailError}
      />
      <FloatingInput
        label="Create a password"
        secureTextEntry
        textContentType="newPassword"
        autoComplete="password-new"
        placeholder="••••••••"
        value={password}
        onChangeText={t => {
          setPassword(t);
          if (passwordError) setPasswordError('');
        }}
        error={passwordError}
        hint="Use 8+ characters with numbers and symbols for a stronger password."
      />
      <PasswordStrengthBar password={password} />
      <FloatingInput
        label="Confirm password"
        secureTextEntry
        textContentType="newPassword"
        autoComplete="password-new"
        placeholder="••••••••"
        value={confirmPassword}
        onChangeText={t => {
          setConfirmPassword(t);
          if (confirmError) setConfirmError('');
        }}
        error={confirmError}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: ageConfirmed }}
        onPress={() => {
          setAgeConfirmed(v => !v);
          if (ageError) setAgeError('');
        }}
        className="mb-2 mt-1 flex-row items-start gap-3.5 rounded-[20px] p-4"
        style={{
          backgroundColor: ageConfirmed
            ? colors.primarySoft
            : ageError
              ? '#fce8e8'
              : colors.surfaceContainer,
        }}>
        <View
          className="mt-0.5 h-6 w-6 items-center justify-center rounded-full"
          style={{
            backgroundColor: ageConfirmed
              ? colors.secondaryContainer
              : ageError
                ? '#f5c2c0'
                : colors.surfaceContainerHighest,
          }}>
          {ageConfirmed ? (
            <Text
              className="text-xs font-bold"
              style={{ color: colors.onSecondaryContainer }}>
              ✓
            </Text>
          ) : null}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-ink">
            I confirm I am 13 or older
          </Text>
          <Text className="mt-1 text-sm leading-5 text-ink-muted">
            Or the minimum digital consent age where I live. Required to create a FluentAI
            account.
          </Text>
        </View>
      </Pressable>
      {ageError ? (
        <Text className="mb-3 text-sm font-medium text-danger">{ageError}</Text>
      ) : (
        <View className="mb-3" />
      )}

      <Button title="Sign up" variant="lavender" loading={loading} onPress={onSubmit} />
      <Pressable className="mt-5 py-2" onPress={() => navigation.navigate('SignIn')}>
        <Text className="text-center text-base text-ink-muted">
          Already have an account?{' '}
          <Text className="font-bold text-brand">Sign in</Text>
        </Text>
      </Pressable>

      <InsightCard className="mt-8" title="Why FluentAI" icon="✨">
        <Text className="text-sm leading-5" style={{ color: colors.tertiary }}>
          Create your account to unlock a personal AI tutor that adapts to your level, goals, and
          daily practice — with gentle corrections that help you improve faster.
        </Text>
      </InsightCard>
    </AuthScreenLayout>
  );
}
