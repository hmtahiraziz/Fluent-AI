import React from 'react';
import { Text, View } from 'react-native';
import { EmptyStateWidget } from './widgets/EmptyStateWidget';

type EmptyStateProps = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState(props: EmptyStateProps) {
  return <EmptyStateWidget {...props} />;
}
