import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { colors } from '../../../theme/tokens';
import type { LanguageMeta } from '../../../config/constants';

type LanguagePairPillProps = {
  native: LanguageMeta;
  target: LanguageMeta;
  level: string;
  style?: ViewStyle;
  compact?: boolean;
};

export function LanguagePairPill({
  native,
  target,
  level,
  style,
  compact = false,
}: LanguagePairPillProps) {
  return (
    <View
      className={`flex-row items-center rounded-full border ${compact ? 'gap-1.5 px-2.5 py-1' : 'gap-2 px-3 py-1.5'}`}
      style={[{ borderColor: colors.borderLight, backgroundColor: colors.surface }, style]}>
      <Text className={compact ? 'text-sm' : 'text-base'}>{native.flag}</Text>
      {!compact ? (
        <Text className="text-xs font-medium text-ink-muted" numberOfLines={1}>
          {native.label}
        </Text>
      ) : null}
      <Text className="text-xs text-ink-faint">→</Text>
      <Text className={compact ? 'text-sm' : 'text-base'}>{target.flag}</Text>
      <Text
        className={`font-bold text-ink ${compact ? 'text-xs' : 'text-xs'}`}
        numberOfLines={1}>
        {target.label}
      </Text>
      <Text className="text-xs text-ink-faint">• {level}</Text>
    </View>
  );
}
