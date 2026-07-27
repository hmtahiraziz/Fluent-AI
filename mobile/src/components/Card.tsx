import React from 'react';
import { View, type ViewProps } from 'react-native';
import { softShadow } from '../theme/glass';
import { colors } from '../theme/tokens';

type CardProps = ViewProps & {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
};

export function Card({ children, className = '', selected = false, style, ...props }: CardProps) {
  return (
    <View
      className={`rounded-3xl bg-surface p-4 ${className}`}
      style={[
        softShadow(selected ? 6 : 4),
        {
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? colors.lavender : colors.border,
          backgroundColor: selected ? colors.lavenderMuted : colors.surface,
        },
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}
