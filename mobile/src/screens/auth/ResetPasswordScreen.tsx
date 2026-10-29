import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/client';
import * as api from '../../api/endpoints';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { AuthHeader } from '../../components/ui/AuthHeader';
import { ErrorCard } from '../../components/ui/ErrorCard';
import { AuthScreenLayout } from '../../components/ui/AuthScreenLayout';
import { FloatingInput, PasswordStrengthBar } from '../../components/ui/FloatingInput';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { useResponsive } from '../../hooks/useResponsive';
import { colors } from '../../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const emailHint = route.params?.email;
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const initialToken =
    route.params?.resetToken ??
    (route.params as { token?: string } | undefined)?.token ??
    '';
  const [resetToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  function validate() {
    let ok = true;
    if (!resetToken.trim()) {
      setError('Missing reset authorization. Verify your email code first.');
      ok = false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      ok = false;
    } else if (password.length > 128) {
      setPasswordError('Password must be at most 128 characters');
      ok = false;
    } else setPasswordError('');
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      ok = false;
    } else setConfirmError('');
    return ok;
  }

  async function onSubmit() {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await api.resetPassword(resetToken.trim(), password);
      navigation.navigate('SignIn', { resetSuccess: true });
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
      centerContent
      header={
        <AuthHeader
          onBack={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('SignIn');
          }}
          horizontalPadding={horizontalPadding}
        />
      }>
      <SplitHeadline className="mb-2" primary="Set new " accent="password" size="xl" />
      <Text className="mb-7 text-base leading-6 text-ink-muted">
        Choose a new password
        {emailHint ? ` for ${emailHint}` : ''}. Your other sessions will be signed out.
      </Text>

      {error ? <ErrorCard message={error} onRetry={onSubmit} /> : null}
      {!resetToken ? (
        <View
          className="mb-6 rounded-2xl px-4 py-3"
          style={{ backgroundColor: colors.surfaceContainerLow }}>
          <Text className="text-sm leading-5 text-ink">
            Verify the six-digit email code first, then return here to set a password.
          </Text>
          <Button
            title="Enter verification code"
            variant="ghost"
            className="mt-2"
            onPress={() => {
              if (emailHint) {
                navigation.navigate('VerifyResetOtp', { email: emailHint });
              } else {
                navigation.navigate('ForgotPassword');
              }
            }}
          />
        </View>
      ) : null}
      <FloatingInput
        label="New password"
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
      <Button
        title="Reset password"
        variant="lavender"
        loading={loading}
        disabled={!resetToken}
        onPress={onSubmit}
      />
    </AuthScreenLayout>
  );
}
