import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { FluentAIBrand } from '../../components/brand/FluentAILogo';
import { ErrorCard } from '../../components/ui/ErrorCard';
import { FloatingInput } from '../../components/ui/FloatingInput';
import { InsightCard } from '../../components/ui/InsightCard';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { useResponsive } from '../../hooks/useResponsive';
import { colors } from '../../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation, route }: Props) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetNotice, setResetNotice] = useState('');

  useEffect(() => {
    if (route.params?.resetSuccess) {
      setResetNotice('Password updated. Sign in with your new password.');
      navigation.setParams({ resetSuccess: undefined });
    }
  }, [navigation, route.params?.resetSuccess]);

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

  return (
    <View className="flex-1 bg-canvas">
      <View
        className="flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 8, paddingHorizontal: horizontalPadding }}>
        <FluentAIBrand iconSize={40} />
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
        <SplitHeadline className="mb-2" primary="Welcome " accent="back" size="xl" />
        <Text className="mb-8 text-base leading-6 text-ink-muted">
          Pick up your conversation with FluentAI.
        </Text>

        {resetNotice ? (
          <View className="mb-4 rounded-card border border-success/30 bg-surface p-4">
            <Text className="text-sm leading-5 text-ink">{resetNotice}</Text>
          </View>
        ) : null}
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
        <FloatingInput
          label="Password"
          labelRight={
            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text className="text-sm font-bold text-brand">Forgot?</Text>
            </Pressable>
          }
          secureTextEntry
          placeholder="••••••••"
          value={password}
          onChangeText={t => {
            setPassword(t);
            if (passwordError) setPasswordError('');
          }}
          error={passwordError}
        />
        <Button title="Sign in" variant="lavender" loading={loading} onPress={onSubmit} />
        <Pressable className="mt-5 py-2" onPress={() => navigation.navigate('CreateAccount')}>
          <Text className="text-center text-base text-ink-muted">
            Don't have an account?{' '}
            <Text className="font-bold text-brand">Sign up</Text>
          </Text>
        </Pressable>

        <InsightCard className="mt-8">
          Our AI adapts to your pace — even a 5-minute session keeps your streak alive.
        </InsightCard>
      </ScrollView>
    </View>
  );
}
