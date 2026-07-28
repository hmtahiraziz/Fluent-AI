import React, { useEffect, useState } from 'react';
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
import { FloatingInput } from '../../components/ui/FloatingInput';
import { InsightCard } from '../../components/ui/InsightCard';
import { SplitHeadline } from '../../components/ui/SplitHeadline';
import { useResponsive } from '../../hooks/useResponsive';
import { spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation, route }: Props) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentMaxWidth, isTablet, isWide } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetNotice, setResetNotice] = useState('');

  const textAlign = isTablet ? ('left' as const) : ('center' as const);

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
    <AuthScreenLayout
      horizontalPadding={horizontalPadding}
      contentMaxWidth={contentMaxWidth}
      centerContent
      contentPaddingTop={isTablet ? spacing.lg : 0}
      bottomPadding={spacing.section}
      header={
        <View
          className="bg-canvas"
          style={{
            paddingTop: insets.top + spacing.sm,
            paddingBottom: spacing.md,
            paddingHorizontal: horizontalPadding,
          }}>
          <FluentAIBrand iconSize={40} />
        </View>
      }
      footer={
        <View
          style={{
            paddingHorizontal: horizontalPadding,
            paddingTop: spacing.lg,
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          }}>
          <Text className="text-center text-xs font-medium text-ink-faint opacity-50">
            © 2024 FluentAI. All rights reserved.
          </Text>
        </View>
      }
      overlay={
        isWide ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: spacing.container * 2,
              bottom: spacing.container * 2,
              maxWidth: 320,
              zIndex: 0,
            }}>
            <InsightCard>
              "Consistency is the secret to fluency. 10 minutes a day beats 2 hours once a week."
            </InsightCard>
          </View>
        ) : null
      }>
      <View className="w-full" style={{ gap: spacing.xl }}>
        <View
          style={{
            gap: spacing.sm,
            alignItems: isTablet ? 'flex-start' : 'center',
          }}>
          <SplitHeadline primary="Welcome " accent="back" size="xl" />
          <Text
            className="max-w-sm text-base leading-6 text-ink-muted"
            style={{ textAlign }}>
            Ready to continue your language journey? Sign in to access your AI-powered lessons.
          </Text>
        </View>

        <View>
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
            label="Password"
            labelRight={
              <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                <Text className="text-xs font-medium text-brand">Forgot?</Text>
              </Pressable>
            }
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            placeholder="••••••••"
            value={password}
            onChangeText={t => {
              setPassword(t);
              if (passwordError) setPasswordError('');
            }}
            error={passwordError}
          />
          <View className="pt-4">
            <Button title="Sign in" variant="lavender" loading={loading} onPress={onSubmit} />
          </View>
        </View>

        <View className="pt-4">
          <Pressable onPress={() => navigation.navigate('CreateAccount')}>
            <Text className="text-base text-ink-muted" style={{ textAlign }}>
              Don't have an account?{' '}
              <Text className="font-bold text-brand">Sign up</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthScreenLayout>
  );
}
