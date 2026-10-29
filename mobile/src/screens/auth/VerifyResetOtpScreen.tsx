import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/client';
import * as api from '../../api/endpoints';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { AuthHeader } from '../../components/ui/AuthHeader';
import { ErrorCard } from '../../components/ui/ErrorCard';
import { AuthScreenLayout } from '../../components/ui/AuthScreenLayout';
import { OtpCodeInput } from '../../components/ui/OtpCodeInput';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { useResponsive } from '../../hooks/useResponsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyResetOtp'>;

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyResetOtpScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const autoSubmitRef = useRef<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const onVerify = useCallback(
    async (nextCode = code) => {
      setError('');
      const trimmed = nextCode.trim();
      if (!/^\d{6}$/.test(trimmed)) {
        setCodeError('Enter the six-digit code from your email');
        return;
      }
      setCodeError('');
      setLoading(true);
      try {
        const result = await api.verifyResetOtp(email, trimmed);
        navigation.navigate('ResetPassword', {
          email,
          resetToken: result.resetToken,
        });
      } catch (e) {
        setError(getErrorMessage(e));
        autoSubmitRef.current = null;
      } finally {
        setLoading(false);
      }
    },
    [code, email, navigation],
  );

  function onCodeChange(next: string) {
    setCode(next);
    if (codeError) setCodeError('');
    if (error) setError('');

    if (next.length === 6 && autoSubmitRef.current !== next && !loading) {
      autoSubmitRef.current = next;
      void onVerify(next);
    }
  }

  async function onResend() {
    if (cooldown > 0 || resending) return;
    setError('');
    setCodeError('');
    setResending(true);
    try {
      await api.requestPasswordReset(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setCode('');
      autoSubmitRef.current = null;
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setResending(false);
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
            else navigation.navigate('ForgotPassword');
          }}
          horizontalPadding={horizontalPadding}
        />
      }>
      <SplitHeadline className="mb-2" primary="Enter " accent="code" size="xl" align="center" />
      <Text className="mb-7 text-center text-base leading-6 text-ink-muted">
        If an account exists for{'\n'}
        <Text className="font-semibold text-ink">{email}</Text>
        {'\n'}a six-digit code was emailed (check spam). Valid for 10 minutes.
      </Text>

      {error ? <ErrorCard message={error} onRetry={() => void onVerify()} /> : null}

      <OtpCodeInput
        value={code}
        onChange={onCodeChange}
        error={codeError}
        editable={!loading}
      />

      <Button
        title="Verify code"
        variant="lavender"
        loading={loading}
        disabled={code.length !== 6}
        onPress={() => void onVerify()}
      />
      <Button
        title={cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
        variant="ghost"
        className="mt-3"
        loading={resending}
        disabled={cooldown > 0 || loading}
        onPress={onResend}
      />
    </AuthScreenLayout>
  );
}
