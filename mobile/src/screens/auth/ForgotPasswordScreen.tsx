import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/client';
import * as api from '../../api/endpoints';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { FluentAIBrand } from '../../components/brand/FluentAILogo';
import { ErrorCard } from '../../components/ui/ErrorCard';
import { FloatingInput } from '../../components/ui/FloatingInput';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { useResponsive } from '../../hooks/useResponsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  async function onSubmit() {
    setError('');
    if (!email.includes('@')) {
      setEmailError('Enter a valid email');
      return;
    }
    setEmailError('');
    setLoading(true);
    try {
      const result = await api.requestPasswordReset(email.trim());
      if (result.resetToken) {
        navigation.navigate('ResetPassword', {
          email: email.trim(),
          resetToken: result.resetToken,
        });
      } else {
        setError(result.message);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-canvas">
      <View
        className="flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 8, paddingHorizontal: horizontalPadding }}>
        <Pressable onPress={() => navigation.goBack()} className="py-2 pr-4">
          <Text className="text-base font-bold text-brand">← Back</Text>
        </Pressable>
        <FluentAIBrand iconSize={36} />
        <View className="w-14" />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: Math.max(insets.bottom, 24),
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
          flexGrow: 1,
          justifyContent: 'center',
        }}>
        <SplitHeadline className="mb-2" primary="Forgot " accent="password?" size="xl" />
        <Text className="mb-8 text-base leading-6 text-ink-muted">
          Enter your email and we'll help you reset your password.
        </Text>

        {error ? <ErrorCard message={error} onRetry={onSubmit} /> : null}
        <FloatingInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="hello@example.com"
          value={email}
          onChangeText={t => {
            setEmail(t);
            if (emailError) setEmailError('');
          }}
          error={emailError}
        />
        <Button title="Send reset link" variant="lavender" loading={loading} onPress={onSubmit} />
      </ScrollView>
    </View>
  );
}
