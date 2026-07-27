import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { ErrorCard } from '../../components/ui/ErrorCard';
import { FloatingInput, PasswordStrengthBar } from '../../components/ui/FloatingInput';
import { FluentAILogo } from '../../components/brand/FluentAILogo';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { Screen } from '../../components/Screen';
import { useResponsive } from '../../hooks/useResponsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreateAccount'>;

export function CreateAccountScreen({ navigation }: Props) {
  const { register } = useAuth();
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
      setEmailError('Enter a valid email address');
      ok = false;
    } else setEmailError('');
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      ok = false;
    } else setPasswordError('');
    return ok;
  }

  async function onSubmit() {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email.trim(), password);
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
        label="Create a password"
        secureTextEntry
        value={password}
        onChangeText={t => {
          setPassword(t);
          if (passwordError) setPasswordError('');
        }}
        error={passwordError}
        hint="Use 8+ characters with numbers and symbols for a stronger password."
      />
      <PasswordStrengthBar password={password} />
      <Button title="Sign up" variant="lavender" loading={loading} onPress={onSubmit} />
      <Pressable className="mt-5 py-2" onPress={() => navigation.navigate('SignIn')}>
        <Text className="text-center text-base text-ink-muted">
          Already have an account?{' '}
          <Text className="font-bold text-brand">Sign in</Text>
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
            <SplitHeadline className="mt-8" primary="Create your" accent="account" />
          </View>
          <View className="flex-1">{form}</View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboard centered>
      <FluentAILogo variant="compact" />
      <SplitHeadline className="mt-6" primary="Sign" accent="up" />
      <Text className="mb-6 mt-2 text-base leading-6 text-ink-muted">
        Join learners practicing with FluentAI.
      </Text>
      {form}
    </Screen>
  );
}
