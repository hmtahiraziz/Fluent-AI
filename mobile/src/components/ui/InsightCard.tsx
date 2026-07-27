import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type InsightCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function InsightCard({
  title = 'AI Insight',
  children,
  className = '',
}: InsightCardProps) {
  return (
    <View
      className={`rounded-card p-5 ${className}`}
      style={{ backgroundColor: colors.insight }}>
      <View className="mb-2 flex-row items-center gap-2">
        <Text className="text-base">✨</Text>
        <Text
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: colors.tertiary }}>
          {title}
        </Text>
      </View>
      {typeof children === 'string' ? (
        <Text className="text-base leading-6" style={{ color: colors.tertiary }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
