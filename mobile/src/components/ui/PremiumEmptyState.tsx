import React from 'react';
import { Text, View } from 'react-native';
import { AppIconMark } from '../brand/AppIconMark';
import { Button } from '../Button';
import { PressableScale } from './PressableScale';

type PremiumEmptyStateProps = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function PremiumEmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: PremiumEmptyStateProps) {
  return (
    <View className="items-center px-6 py-12">
      <AppIconMark size={64} />
      <Text className="mt-6 text-center text-2xl font-extrabold text-ink">{title}</Text>
      <Text className="mt-3 max-w-sm text-center text-base leading-6 text-ink-muted">
        {subtitle}
      </Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="lavender" className="mt-8 w-full max-w-xs" onPress={onAction} />
      ) : null}
    </View>
  );
}

type VocabChipProps = {
  phrase: string;
  onPress?: () => void;
};

export function VocabChip({ phrase, onPress }: VocabChipProps) {
  const content = (
    <View className="mr-2 mb-2 rounded-full border border-lavender bg-lavender-muted px-3 py-1.5">
      <Text className="text-sm font-semibold text-brand">{phrase}</Text>
    </View>
  );
  if (onPress) {
    return <PressableScale onPress={onPress}>{content}</PressableScale>;
  }
  return content;
}
