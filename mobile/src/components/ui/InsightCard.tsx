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
      className={`gap-3 rounded-[24px] p-6 ${className}`}
      style={{ backgroundColor: colors.insight }}>
      <View className="flex-row items-center gap-2">
        <Text className="text-lg">✨</Text>
        <Text
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: colors.tertiary }}>
          {title}
        </Text>
      </View>
      {typeof children === 'string' ? (
        <Text className="text-base leading-6 text-ink-muted">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
