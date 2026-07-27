import React from 'react';
import { Text, View } from 'react-native';
import { FluentAILogo } from './brand/FluentAILogo';
import { TutorAvatar } from './brand/TutorAvatar';
import { colors } from '../theme/tokens';

type MascotBubbleProps = {
  message: string;
  size?: 'sm' | 'md' | 'lg';
};

export function MascotBubble({ message, size = 'md' }: MascotBubbleProps) {
  const avatarSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';
  return (
    <View className="mb-6 flex-row items-start gap-3">
      <TutorAvatar size={avatarSize === 'lg' ? 'md' : 'sm'} />
      <View
        className="flex-1 rounded-2xl rounded-tl-md bg-surface px-4 py-3"
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.ink,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}>
        <Text className="text-base leading-6 text-ink">{message}</Text>
      </View>
    </View>
  );
}

export function MascotHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View className="mb-8 items-center">
      <TutorAvatar size="lg" />
      <Text className="mt-4 text-center text-3xl font-extrabold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-base leading-6 text-ink-muted">
        {subtitle}
      </Text>
    </View>
  );
}

export function AuthHero() {
  return (
    <View className="mb-8 items-center">
      <FluentAILogo variant="full" />
    </View>
  );
}
