import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cardStyle, softShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type GlassCardProps = ViewProps & {
  children: React.ReactNode;
  tint?: 'default' | 'lavender' | 'gold' | 'insight' | 'surface';
  className?: string;
};

const tints = {
  default: colors.surface,
  lavender: colors.primarySoft,
  gold: colors.phraseCard,
  insight: colors.insight,
  surface: colors.surfaceContainerLow,
};

export function GlassCard({
  children,
  tint = 'default',
  className = '',
  style,
  ...props
}: GlassCardProps) {
  return (
    <View
      className={`rounded-card p-5 ${className}`}
      style={[{ ...cardStyle, backgroundColor: tints[tint] }, softShadow(), style]}
      {...props}>
      {children}
    </View>
  );
}
