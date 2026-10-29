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
      className="my-3 rounded-[20px] p-4"
      style={{ backgroundColor: '#fce8e8' }}>
      <Text className="text-sm font-bold" style={{ color: colors.danger }}>
        Something went wrong
      </Text>
      <Text className="mt-1.5 text-sm leading-5 text-ink">{message}</Text>
      {onRetry ? (
        <Button title={retryLabel} variant="ghost" className="mt-3" onPress={onRetry} />
      ) : null}
    </View>
  );
}
