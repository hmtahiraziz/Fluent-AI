import React, { useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/client';
import * as api from '../../api/endpoints';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { AuthHeader } from '../../components/ui/AuthHeader';
import { ErrorCard } from '../../components/ui/ErrorCard';
import { AuthScreenLayout } from '../../components/ui/AuthScreenLayout';
import { FloatingInput } from '../../components/ui/FloatingInput';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { useResponsive } from '../../hooks/useResponsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  async function onSubmit() {
    setError('');
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setEmailError('Enter a valid email');
      return;
    }
    setEmailError('');
    setLoading(true);
    try {
      await api.requestPasswordReset(trimmed);
      navigation.navigate('VerifyResetOtp', { email: trimmed });
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
      <SplitHeadline className="mb-2" primary="Forgot " accent="password?" size="xl" />
      <Text className="mb-7 text-base leading-6 text-ink-muted">
        Enter the email for your FluentAI account. If it exists, we will send a
        six-digit code — check inbox and spam.
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
      <Button
        title="Send reset code"
        variant="lavender"
        loading={loading}
        onPress={onSubmit}
      />
    </AuthScreenLayout>
  );
}
