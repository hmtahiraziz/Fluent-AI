import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '../Button';
import { GlassCard } from './GlassCard';

type ErrorCardProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorCard({
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorCardProps) {
  return (
    <GlassCard className="my-4">
      <Text className="text-base font-bold text-coral">Something went wrong</Text>
      <Text className="mt-2 text-sm leading-5 text-ink-muted">{message}</Text>
      {onRetry ? (
        <Button title={retryLabel} variant="outline" className="mt-4" onPress={onRetry} />
      ) : null}
    </GlassCard>
  );
}
