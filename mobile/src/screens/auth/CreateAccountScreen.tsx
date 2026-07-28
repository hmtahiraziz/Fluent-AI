import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { FluentAIBrand } from '../../components/brand/FluentAILogo';
import { ErrorCard } from '../../components/ui/ErrorCard';
import { AuthScreenLayout } from '../../components/ui/AuthScreenLayout';
import { FloatingInput, PasswordStrengthBar } from '../../components/ui/FloatingInput';
import { InsightCard } from '../../components/ui/InsightCard';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { useResponsive } from '../../hooks/useResponsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreateAccount'>;

export function CreateAccountScreen({ navigation }: Props) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentMaxWidth } = useResponsive();
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

  return (
    <AuthScreenLayout
      horizontalPadding={horizontalPadding}
      contentMaxWidth={contentMaxWidth}
      header={
        <View
          className="flex-row items-center"
          style={{ paddingTop: insets.top + 8, paddingHorizontal: horizontalPadding }}>
          <FluentAIBrand iconSize={40} />
        </View>
      }>
      <SplitHeadline className="mt-6 mb-2" primary="Create your " accent="account" size="xl" />
      <Text className="mb-8 text-base leading-6 text-ink-muted">
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
      <Button title="Sign up" variant="lavender" loading={loading} onPress={onSubmit} />
      <Pressable className="mt-5 py-2" onPress={() => navigation.navigate('SignIn')}>
        <Text className="text-center text-base text-ink-muted">
          Already have an account?{' '}
          <Text className="font-bold text-brand">Sign in</Text>
        </Text>
      </Pressable>

      <InsightCard className="mt-8">
        Create your account to unlock personalized AI tutoring tailored to your goals.
      </InsightCard>
    </AuthScreenLayout>
  );
}
