import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/client';
import * as api from '../../api/endpoints';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { FluentAIBrand } from '../../components/brand/FluentAILogo';
import { ErrorCard } from '../../components/ui/ErrorCard';
import { AuthScreenLayout } from '../../components/ui/AuthScreenLayout';
import { FloatingInput, PasswordStrengthBar } from '../../components/ui/FloatingInput';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { useResponsive } from '../../hooks/useResponsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { email, resetToken } = route.params;
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  function validate() {
    let ok = true;
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
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
      await api.resetPassword(resetToken, password);
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
        <View
          className="flex-row items-center justify-between"
          style={{ paddingTop: insets.top + 8, paddingHorizontal: horizontalPadding }}>
          <Pressable onPress={() => navigation.goBack()} className="py-2 pr-4">
            <Text className="text-base font-bold text-brand">← Back</Text>
          </Pressable>
          <FluentAIBrand iconSize={36} />
          <View className="w-14" />
        </View>
      }>
      <SplitHeadline className="mb-2" primary="Set new " accent="password" size="xl" />
      <Text className="mb-8 text-base leading-6 text-ink-muted">
        Create a new password for {email}.
      </Text>

      {error ? <ErrorCard message={error} onRetry={onSubmit} /> : null}
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
      <Button title="Reset password" variant="lavender" loading={loading} onPress={onSubmit} />
    </AuthScreenLayout>
  );
}
