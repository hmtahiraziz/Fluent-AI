import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { PressableScale } from '../../../components/ui/PressableScale';
import { softShadow } from '../../../theme/glass';
import { colors } from '../../../theme/tokens';
import type { LanguageMeta } from '../../../config/constants';

type LanguagePairPillProps = {
  native: LanguageMeta;
  target: LanguageMeta;
  level: string;
  style?: ViewStyle;
  compact?: boolean;
  /** pill = chat header strip; card = small boxed chip (Home AI Tutor) */
  variant?: 'pill' | 'card';
  onPress?: () => void;
};

export function LanguagePairPill({
  native,
  target,
  level,
  style,
  compact = false,
  variant = 'pill',
  onPress,
}: LanguagePairPillProps) {
  if (variant === 'card') {
    const card = (
      <View
        className="rounded-[14px] px-2.5 py-2"
        style={[
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
            maxWidth: 118,
          },
          softShadow(1),
          style,
        ]}>
        <View className="flex-row items-center gap-1">
          <Text className="text-sm leading-4">{native.flag}</Text>
          <Text className="text-[10px] font-bold text-ink-muted">→</Text>
          <Text className="text-sm leading-4">{target.flag}</Text>
        </View>
        <Text
          className="mt-1 text-[10px] font-bold leading-3 text-ink"
          numberOfLines={1}>
          {native.label} → {target.label}
        </Text>
        <View
          className="mt-1.5 self-start rounded-full px-1.5 py-0.5"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-[9px] font-bold text-brand">CEFR {level}</Text>
        </View>
      </View>
    );

    if (!onPress) return card;
    return (
      <PressableScale
        onPress={onPress}
        accessibilityLabel={`${native.label} to ${target.label}, CEFR ${level}. Open language settings`}>
        {card}
      </PressableScale>
    );
  }

  return (
    <View
      className={`flex-row items-center rounded-full ${compact ? 'gap-1.5 px-2.5 py-1' : 'gap-2 px-3 py-1.5'}`}
      style={[{ backgroundColor: colors.surface }, style]}>
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
