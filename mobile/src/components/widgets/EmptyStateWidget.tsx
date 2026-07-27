import React from 'react';
import { Text, View } from 'react-native';
import { AppIconMark } from '../brand/AppIconMark';
import { Button } from '../Button';

type EmptyStateWidgetProps = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyStateWidget({
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateWidgetProps) {
  return (
    <View className="items-center py-12">
      <AppIconMark size={56} />
      <Text className="mt-4 text-center text-xl font-extrabold text-ink">{title}</Text>
      <Text className="mt-2 max-w-xs text-center text-base leading-6 text-ink-muted">
        {subtitle}
      </Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} className="mt-6 w-full max-w-xs" onPress={onAction} />
      ) : null}
    </View>
  );
}
