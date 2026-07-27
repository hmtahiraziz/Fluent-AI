import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { ErrorCard } from '../../components/ui/ErrorCard';
import { FloatingInput } from '../../components/ui/FloatingInput';
import { FluentAILogo } from '../../components/brand/FluentAILogo';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { Screen } from '../../components/Screen';
import { useResponsive } from '../../hooks/useResponsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { isTablet } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  function validate() {
    let ok = true;
    if (!email.includes('@')) {
      setEmailError('Enter a valid email');
      ok = false;
    } else setEmailError('');
    if (!password) {
      setPasswordError('Password is required');
      ok = false;
    } else setPasswordError('');
    return ok;
  }

  async function onSubmit() {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  const form = (
    <>
      {error ? <ErrorCard message={error} onRetry={onSubmit} /> : null}
      <FloatingInput
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={t => {
          setEmail(t);
          if (emailError) setEmailError('');
        }}
        error={emailError}
      />
      <FloatingInput
        label="Password"
        secureTextEntry
        value={password}
        onChangeText={t => {
          setPassword(t);
          if (passwordError) setPasswordError('');
        }}
        error={passwordError}
      />
      <Button title="Sign in" variant="lavender" loading={loading} onPress={onSubmit} />
      <Pressable
        className="mt-5 py-2"
        onPress={() => navigation.navigate('CreateAccount')}>
        <Text className="text-center text-base text-ink-muted">
          Don't have an account?{' '}
          <Text className="font-bold text-brand">Sign up</Text>
        </Text>
      </Pressable>
    </>
  );

  if (isTablet) {
    return (
      <Screen scroll keyboard centered>
        <View className="flex-row gap-12 py-8">
          <View className="flex-1 justify-center">
            <FluentAILogo variant="full" />
            <SplitHeadline className="mt-8" primary="Welcome" accent="back!" />
          </View>
          <View className="flex-1">{form}</View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboard centered>
      <FluentAILogo variant="compact" />
      <SplitHeadline className="mt-6" primary="Sign" accent="in" />
      <Text className="mb-6 mt-2 text-base leading-6 text-ink-muted">
        Pick up your conversation with FluentAI.
      </Text>
      {form}
    </Screen>
  );
}
