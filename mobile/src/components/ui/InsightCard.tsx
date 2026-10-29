import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type InsightCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: string;
};

export function InsightCard({
  title = 'AI Insight',
  children,
  className = '',
  icon = '✨',
}: InsightCardProps) {
  return (
    <View
      className={`rounded-[20px] p-5 ${className}`}
      style={{ backgroundColor: colors.insight }}>
      <View className="mb-2.5 flex-row items-center gap-2.5">
        <View
          className="h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.surface }}>
          <Text className="text-base">{icon}</Text>
        </View>
        <Text
          className="flex-1 text-xs font-bold uppercase tracking-wider"
          style={{ color: colors.tertiary }}>
          {title}
        </Text>
      </View>
      {typeof children === 'string' ? (
        <Text className="text-sm leading-5" style={{ color: colors.tertiary }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
