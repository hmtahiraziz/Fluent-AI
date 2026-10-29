import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Who we are',
    body:
      'FluentAI (“we”) provides a language-learning mobile app with AI tutoring. Contact: privacy@fluentai.app.',
  },
  {
    title: 'Data we collect',
    body:
      'Account email and password hash; learning settings (languages, level, daily goal, LLM consent); conversations, messages, and vocabulary you save; content reports you submit; and on-device profile display name, avatar, and practice streaks.',
  },
  {
    title: 'How we use data',
    body:
      'To authenticate you, personalize tutoring, enforce AI quotas, and improve safety. After you consent in-app, chat content is sent to our language-model provider to generate replies.',
  },
  {
    title: 'Sharing',
    body:
      'We do not sell personal data. Processors may include our database host, email (SMTP) provider, and the configured model provider for tutoring and moderation.',
  },
  {
    title: 'Age',
    body:
      'FluentAI is for users 13+ (or the minimum digital consent age where you live). We require age confirmation at signup.',
  },
  {
    title: 'Retention & deletion',
    body:
      'You can delete your account in the app (Profile → Privacy & Security → Delete account). Server-side account data is removed; model providers may retain data per their policies.',
  },
  {
    title: 'Security',
    body:
      'Passwords are hashed (bcrypt). Sessions use short-lived access tokens and hashed refresh tokens. Transport uses HTTPS in production.',
  },
];

export function PrivacyPolicyScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentMaxWidth } = useResponsive();

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View
        className="flex-row items-center justify-between pb-3 pt-2"
        style={{ paddingHorizontal: horizontalPadding }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 flex-row items-center justify-center rounded-full px-3"
          style={{ backgroundColor: colors.surfaceContainer }}>
          <Text className="text-sm font-bold text-brand">← Back</Text>
        </Pressable>
        <Text className="text-base font-bold text-ink">Privacy Policy</Text>
        <View style={{ width: 76 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: Math.max(insets.bottom, 24) + 16,
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
        }}
        showsVerticalScrollIndicator={false}>
        <Text className="mt-2 text-3xl font-extrabold text-ink">FluentAI Privacy Policy</Text>
        <Text className="mt-2 text-sm leading-5 text-ink-muted">
          Last updated: March 27, 2026
        </Text>

        {SECTIONS.map(section => (
          <View
            key={section.title}
            className="mt-5 rounded-[20px] p-4"
            style={{ backgroundColor: colors.surfaceContainer }}>
            <Text className="text-base font-bold text-ink">{section.title}</Text>
            <Text className="mt-2 text-sm leading-6 text-ink-muted">{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
