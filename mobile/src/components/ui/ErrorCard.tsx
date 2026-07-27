import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '../Button';
import { colors } from '../../theme/tokens';

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
    <View
      className="my-4 rounded-card border p-5"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.coral,
      }}>
      <Text className="text-base font-bold" style={{ color: colors.coral }}>
        Something went wrong
      </Text>
      <Text className="mt-2 text-sm leading-5 text-ink">{message}</Text>
      {onRetry ? (
        <Button title={retryLabel} variant="outline" className="mt-4" onPress={onRetry} />
      ) : null}
    </View>
  );
}
