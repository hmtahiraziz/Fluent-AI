import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '../Button';
import { LanguageBadge, LevelBadge } from '../Badges';
import { colors } from '../../theme/tokens';

type QuickActionWidgetProps = {
  title: string;
  subtitle: string;
  languageCode: string;
  level: string;
  actionLabel: string;
  loading?: boolean;
  onAction: () => void;
};

export function QuickActionWidget({
  title,
  subtitle,
  languageCode,
  level,
  actionLabel,
  loading,
  onAction,
}: QuickActionWidgetProps) {
  return (
    <View
      className="overflow-hidden rounded-2xl bg-brand p-5"
      style={{
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
      }}>
      <View className="mb-3 flex-row items-center gap-2">
        <LanguageBadge code={languageCode} />
        <LevelBadge level={level} />
      </View>
      <Text className="text-xl font-extrabold text-white">{title}</Text>
      <Text className="mt-2 text-base leading-6 text-white/85">{subtitle}</Text>
      <Button
        title={actionLabel}
        variant="light"
        loading={loading}
        className="mt-5"
        onPress={onAction}
      />
    </View>
  );
}
