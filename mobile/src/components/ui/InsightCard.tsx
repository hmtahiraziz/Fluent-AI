import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type InsightCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function InsightCard({
  title = 'AI Tip',
  children,
  className = '',
}: InsightCardProps) {
  return (
    <View
      className={`flex-row items-start gap-4 rounded-[24px] p-6 ${className}`}
      style={{ backgroundColor: colors.insight }}>
      <View className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
        <Text className="text-lg">✨</Text>
      </View>
      <View className="flex-1">
        <Text className="mb-1 text-sm font-bold" style={{ color: colors.tertiary }}>
          {title}
        </Text>
        {typeof children === 'string' ? (
          <Text className="text-base leading-6" style={{ color: colors.tertiaryContainer }}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
