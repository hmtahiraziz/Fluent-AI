import React from 'react';
import { View, type ViewProps } from 'react-native';
import { flatInsight, flatSelected, flatSurface, flatTint } from '../../theme/glass';
import { colors, radii } from '../../theme/tokens';

type SurfaceTint = 'surface' | 'tint' | 'insight' | 'selected' | 'soft';

type SurfaceProps = ViewProps & {
  children: React.ReactNode;
  tint?: SurfaceTint;
  /** Override default card radius (24). */
  radius?: number;
  className?: string;
  padded?: boolean;
};

const tintStyles = {
  surface: flatSurface(),
  tint: flatTint(),
  insight: flatInsight(),
  selected: flatSelected(),
  soft: { borderRadius: radii.card, backgroundColor: colors.primarySoft },
} as const;

/**
 * Flat rounded container using FluentAI brand colors — no shadows or elevation.
 */
export function Surface({
  children,
  tint = 'surface',
  radius,
  className = '',
  padded = true,
  style,
  ...props
}: SurfaceProps) {
  return (
    <View
      className={`${padded ? 'p-5' : ''} ${className}`}
      style={[
        tintStyles[tint],
        radius != null ? { borderRadius: radius } : null,
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}
