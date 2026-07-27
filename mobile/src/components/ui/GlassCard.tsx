import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cardStyle, softShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type GlassCardProps = ViewProps & {
  children: React.ReactNode;
  tint?: 'default' | 'lavender' | 'gold';
  className?: string;
};

const tints = {
  default: colors.surface,
  lavender: colors.lavenderMuted,
  gold: colors.phraseCard,
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
      className={`p-4 ${className}`}
      style={[{ ...cardStyle, backgroundColor: tints[tint] }, softShadow(), style]}
      {...props}>
      {children}
    </View>
  );
}
